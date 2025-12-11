import Link from "next/link";

export default function RepoCard({ repo }: { repo: any }) {
  return (
    <Link
      href={`/repos/${repo.id}`}
      className="p-4 rounded border block transition-colors bg-gray-900 text-gray-100 border-gray-800 hover:bg-gray-850 hover:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800 dark:hover:bg-gray-850"
    >
      <h3 className="font-semibold">{repo.name}</h3>
      <p className="text-sm text-gray-300">{repo.url}</p>
    </Link>
  );
}
