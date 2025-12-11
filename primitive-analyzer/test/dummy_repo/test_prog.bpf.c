#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
} test_map SEC(".maps");

SEC("xdp/devmap")
int xdp_handler(struct xdp_md *ctx) {
    int key = 0;
    int *value;

    value = bpf_map_lookup_elem(&test_map, &key);
    if (value)
        bpf_trace_printk("Value: %d\n", *value);

    return XDP_PASS;
}

SEC("cgroup/connect4")
int cg_handler(struct bpf_sock_addr *ctx) {
    bpf_get_current_pid_tgid();
    bpf_sock_addr_set_port(ctx, 8080);
    return 1;
}

SEC("sk_skb/stream_parser")
int stream_parse(struct __sk_buff *skb) {
    bpf_printk("Parsing stream");
    return 0;
}
