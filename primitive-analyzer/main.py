#!/usr/bin/env python3
"""
Repo eBPF feature parser

Discovers across a repository:
 - map types used (and counts)
 - program attach types used (and counts)
 - helper functions used (and counts)
 - declared program type(s) inferred via SEC() and ground truth
 - explicit program type tokens (BPF_PROG_TYPE_*) if present

Ground truth for valid names is loaded from data/feature-versions.yaml.

Usage:
  python -m tools.repo_parser.main --repo <path> [--features <path>] [--json]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from typing import Dict, Iterable, List, Optional, Set, Tuple

try:
    import yaml
except ImportError:
    print("PyYAML required. Install with: pip install pyyaml", file=sys.stderr)
    raise


# ----------------------------
# Ground-truth loading helpers
# ----------------------------

def load_feature_sets(features_yaml_path: str) -> Dict[str, Dict[str, Set[str]]]:
    """
    Loads YAML and returns:

    {
        'program_types': {
            kernel_prog_type_name: {literal1, literal2, ...}
        },
        'map_types': {map_names...},
        'attach_types': {attach_names...},
        'helpers': {helper_names...}
    }
    """
    with open(features_yaml_path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)

    result = {
        'program_types': {},
        'map_types': set(),
        'attach_types': set(),
        'helpers': set(),
    }

    for section in data:
        name = section.get('name')
        features = section.get('features', [])
        if not isinstance(features, list):
            continue

        # program types need literal mapping
        if name == 'program_types':
            for feat in features:
                kernel_type = feat.get('name')
                literal_list = feat.get('literals', [])
                if kernel_type and isinstance(literal_list, list):
                    result['program_types'][kernel_type] = set(literal_list)

        # simple name-only sets
        elif name in ('map_types', 'attach_types', 'helpers'):
            for feat in features:
                feat_name = feat.get('name')
                if feat_name:
                    result[name].add(feat_name)

    return result



# ----------------------------
# Repo scanning utilities
# ----------------------------

DEFAULT_INCLUDE_EXTS = {
    '.c', '.h', '.bpf.c', '.bpf.h', '.ebpf.c', '.ebpf.h', '.cc', '.cpp', '.hpp',
    '.go', '.rs', '.skel.h', '.skel.c'
}

EXCLUDE_DIRS = {'.git', 'build', 'dist', 'out', 'node_modules', 'vendor', 'target', '.venv',
                 '.mypy_cache', '.pytest_cache'}


def iter_files(root: str, include_exts: Set[str] = DEFAULT_INCLUDE_EXTS) -> Iterable[str]:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith('.')]
        for fn in filenames:
            low = fn.lower()
            path = os.path.join(dirpath, fn)
            for ext in include_exts:
                if low.endswith(ext):
                    yield path
                    break


# ---------------------------------
# Patterns for extracting from code
# ---------------------------------

RE_SEC = re.compile(r'\bSEC\s*\(\s*"([^"]+)"\s*\)')
RE_SECTION_ATTR = re.compile(r'section\s*\(\s*"([^"]+)"\s*\)')
RE_HELPER_CALL = re.compile(r'\b(bpf_[a-z0-9_]+)\s*\(')
RE_TOKEN = re.compile(r'\b([A-Z][A-Z0-9_]{2,})\b')


def read_text(path: str) -> Optional[str]:
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception:
        return None


# ----------------------------
# SEC helpers
# ----------------------------

def sec_prefix_candidates(sec: str) -> Tuple[str, Optional[str]]:
    """
    Return (first_literal, first_two_literals_or_None).

    Examples:
      'xdp' -> ('xdp', None)
      'xdp/devmap/redirect' -> ('xdp', 'xdp/devmap')
    """
    parts = sec.split('/')
    first = parts[0]
    first_two = f"{parts[0]}/{parts[1]}" if len(parts) >= 2 else None
    return first, first_two


def infer_program_type_from_sec(sec: str, program_types: Dict[str, Set[str]]) -> Optional[str]:
    """
    Given a SEC string and a mapping:
        {kernel_prog_type_name: {literals...}}

    A literal matches if SEC starts with the literal exactly or if the literal equals:
    - first literal
    - first-two literal

    If match found, return the kernel program type name.

    If none match, return None.
    """
    first, first_two = sec_prefix_candidates(sec)

    # possible SEC prefixes to test
    candidates = {first}
    if first_two:
        candidates.add(first_two)

    for kernel_type, literal_set in program_types.items():
        if any(c in literal_set for c in candidates):
            return kernel_type

    return None


# ----------------------------
# Attach type inference
# ----------------------------

# def infer_attach_from_sec(sec: str, attach_types: Set[str]) -> List[str]:
#     """Best effort mapping from SEC strings to BPF attach types."""
#     s = sec.strip()
#     out: List[str] = []

#     if s == 'xdp' and 'BPF_XDP' in attach_types:
#         out.append('BPF_XDP')
#     elif s.startswith('xdp/devmap') and 'BPF_XDP_DEVMAP' in attach_types:
#         out.append('BPF_XDP_DEVMAP')
#     elif s.startswith('xdp/cpumap') and 'BPF_XDP_CPUMAP' in attach_types:
#         out.append('BPF_XDP_CPUMAP')

#     if s.startswith('tcx/ingress') and 'BPF_TCX_INGRESS' in attach_types:
#         out.append('BPF_TCX_INGRESS')
#     if s.startswith('tcx/egress') and 'BPF_TCX_EGRESS' in attach_types:
#         out.append('BPF_TCX_EGRESS')

#     if s.startswith('sk_lookup') and 'BPF_SK_LOOKUP' in attach_types:
#         out.append('BPF_SK_LOOKUP')
#     if s.startswith('sk_skb/stream_parser') and 'BPF_SK_SKB_STREAM_PARSER' in attach_types:
#         out.append('BPF_SK_SKB_STREAM_PARSER')
#     if s.startswith('sk_skb/stream_verdict') and 'BPF_SK_SKB_STREAM_VERDICT' in attach_types:
#         out.append('BPF_SK_SKB_STREAM_VERDICT')
#     if s.startswith('sk_msg') and 'BPF_SK_MSG_VERDICT' in attach_types:
#         out.append('BPF_SK_MSG_VERDICT')

#     if s.startswith('perf_event') and 'BPF_PERF_EVENT' in attach_types:
#         out.append('BPF_PERF_EVENT')

#     if s.startswith('lirc_mode2') and 'BPF_LIRC_MODE2' in attach_types:
#         out.append('BPF_LIRC_MODE2')

#     if s.startswith('flow_dissector') and 'BPF_FLOW_DISSECTOR' in attach_types:
#         out.append('BPF_FLOW_DISSECTOR')

#     if s.startswith('cgroup/'):
#         tail = s[len('cgroup/'):]
#         mapping = {
#             'inet_ingress': 'BPF_CGROUP_INET_INGRESS',
#             'inet_egress': 'BPF_CGROUP_INET_EGRESS',
#             'sock_create': 'BPF_CGROUP_INET_SOCK_CREATE',
#             'connect4': 'BPF_CGROUP_INET4_CONNECT',
#             'connect6': 'BPF_CGROUP_INET6_CONNECT',
#             'bind4': 'BPF_CGROUP_INET4_BIND',
#             'bind6': 'BPF_CGROUP_INET6_BIND',
#             'post_bind4': 'BPF_CGROUP_INET4_POST_BIND',
#             'post_bind6': 'BPF_CGROUP_INET6_POST_BIND',
#             'recvmsg4': 'BPF_CGROUP_UDP4_RECVMSG',
#             'recvmsg6': 'BPF_CGROUP_UDP6_RECVMSG',
#             'sendmsg4': 'BPF_CGROUP_UDP4_SENDMSG',
#             'sendmsg6': 'BPF_CGROUP_UDP6_SENDMSG',
#             'getsockopt': 'BPF_CGROUP_GETSOCKOPT',
#             'setsockopt': 'BPF_CGROUP_SETSOCKOPT',
#             'sysctl': 'BPF_CGROUP_SYSCTL',
#         }
#         if tail in mapping and mapping[tail] in attach_types:
#             out.append(mapping[tail])

#     return out


# ----------------------------
# Attach Point from Sec
# ----------------------------

def extract_attach_from_sec(sec: str) -> str:
    """
    Extracts the attach point from a SEC string by taking the last literal.
    Example: 'tcx/ingress' -> 'ingress'
             'cgroup/connect6' -> 'connect6'
             'xdp/devmap/redirect' -> 'redirect'
    """
    parts = sec.split('/')
    return parts[-1]


# ----------------------------
# Core parsing routine
# ----------------------------

def parse_repo(repo_root: str, features_path: str) -> Dict[str, Dict[str, int]]:
    gt = load_feature_sets(features_path)
    helpers_set = gt['helpers']
    map_types_set = gt['map_types']
    attach_types_set = gt['attach_types']
    program_types_set = gt['program_types']
    program_types_dict = gt['program_types']

    helper_counts: Counter[str] = Counter()
    map_type_counts: Counter[str] = Counter()
    attach_type_counts: Counter[str] = Counter()
    program_type_counts: Counter[str] = Counter()
    sec_full_counts: Counter[str] = Counter()
    prog_type_token_counts: Counter[str] = Counter()

    if helpers_set:
        helpers_alt = '|'.join(sorted(re.escape(h) for h in helpers_set))
        re_helper_exact = re.compile(rf'\b({helpers_alt})\s*\(')
    else:
        re_helper_exact = RE_HELPER_CALL

    map_alt = '|'.join(sorted(re.escape(m) for m in map_types_set)) if map_types_set else None
    re_map_token = re.compile(rf'\b({map_alt})\b') if map_alt else None

    attach_alt = '|'.join(sorted(re.escape(a) for a in attach_types_set)) if attach_types_set else None
    re_attach_token = re.compile(rf'\b({attach_alt})\b') if attach_alt else None

    prog_alt = '|'.join(sorted(re.escape(p) for p in program_types_set)) if program_types_set else None
    re_prog_token = re.compile(rf'\b({prog_alt})\b') if prog_alt else None

    for path in iter_files(repo_root):
        text = read_text(path)
        if not text:
            continue

        # SEC() and attribute section()
        for sec_match in list(RE_SEC.finditer(text)) + list(RE_SECTION_ATTR.finditer(text)):
            sec = sec_match.group(1)
            sec_full_counts[sec] += 1

            # Exclude non-literal sections like ".maps" from inferred types.
            first, first_two = sec_prefix_candidates(sec)
            # Determine if the first or first-two literal exists in any program type literal set
            has_valid_literal = any(
                (first in lits) or (first_two is not None and first_two in lits)
                for lits in program_types_dict.values()
            )

            if has_valid_literal:
                kernel_type = infer_program_type_from_sec(sec, program_types_dict)
                if kernel_type:
                    program_type_counts[kernel_type] += 1

            # for at in infer_attach_from_sec(sec, attach_types_set):
            #     attach_type_counts[at] += 1

            attach_literal = extract_attach_from_sec(sec)
            attach_type_counts[attach_literal] += 1

        # helpers
        for m in re_helper_exact.finditer(text):
            helper_counts[m.group(1)] += 1

        # map types
        if re_map_token:
            for m in re_map_token.finditer(text):
                map_type_counts[m.group(1)] += 1

        # explicit attach type tokens
        if re_attach_token:
            for m in re_attach_token.finditer(text):
                attach_type_counts[m.group(1)] += 1

        # explicit program type tokens
        if re_prog_token:
            for m in re_prog_token.finditer(text):
                prog_type_token_counts[m.group(1)] += 1

    return {
        'map_types': dict(map_type_counts),
        'attach_types': dict(attach_type_counts),
        'helpers': dict(helper_counts),
        'program_sections': {
            'sec_full': dict(sec_full_counts),
        },
        'program_types_inferred': dict(program_type_counts),
        'program_types_tokens': dict(prog_type_token_counts),
    }


def default_features_path(start_path: str) -> str:
    here = os.path.abspath(start_path)
    if os.path.isfile(here):
        here = os.path.dirname(here)
    cur = here
    while True:
        candidate = os.path.join(cur, 'data', 'feature-versions.yaml')
        if os.path.exists(candidate):
            return candidate
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return os.path.join(here, 'data', 'feature-versions.yaml')


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="Parse an eBPF repository.")
    ap.add_argument('--repo', required=True)
    ap.add_argument('--features', default=None)
    ap.add_argument('--json', action='store_true')
    args = ap.parse_args(argv)

    repo_root = os.path.abspath(args.repo)
    if not os.path.isdir(repo_root):
        print(f"Repository not found: {repo_root}", file=sys.stderr)
        return 2

    features_path = args.features or default_features_path(repo_root)
    if not os.path.isfile(features_path):
        print(f"feature-versions.yaml not found at {features_path}", file=sys.stderr)
        return 2

    results = parse_repo(repo_root, features_path)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        def print_counter(title: str, d: Dict[str, int]) -> None:
            print(f"\n{title} ({sum(d.values())} occurrences, {len(d)} unique):")
            for k, v in sorted(d.items(), key=lambda kv: (-kv[1], kv[0])):
                print(f"  {k}: {v}")

        print_counter('Map types', results['map_types'])
        print_counter('Attach types', results['attach_types'])
        print_counter('Helpers', results['helpers'])
        # For program types, display unique set only (ignore occurrence counts in textual mode)
        prog_types_unique = sorted(results['program_types_inferred'].keys())
        print(f"\nProgram types (unique) ({len(prog_types_unique)} types):")
        for pt in prog_types_unique:
            print(f"  {pt}")
        print_counter('Program type tokens (BPF_PROG_TYPE_*)', results['program_types_tokens'])
        print_counter('SEC full', results['program_sections']['sec_full'])

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
