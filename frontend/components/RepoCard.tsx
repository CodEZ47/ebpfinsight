import Link from "next/link";

export default function RepoCard({ repo }: { repo: any }) {
  return (
    <Link
      href={`/repos/${repo.id}`}
      className="p-4 bg-white rounded shadow hover:shadow-md block"
    >
      <h3 className="font-semibold">{repo.name}</h3>
      <p className="text-sm text-gray-600">{repo.url}</p>
    </Link>
  );
}
