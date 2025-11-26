import Link from "next/link";

export default async function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold mb-6">eBPF Insight</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/repos/new"
          className="p-6 bg-white rounded shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Add a GitHub repo</h2>
          <p className="text-sm text-gray-600">
            Add a repository to analyze and test.
          </p>
        </Link>

        <Link
          href="/repos"
          className="p-6 bg-white rounded shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">View all repos</h2>
          <p className="text-sm text-gray-600">
            Browse added repositories and results.
          </p>
        </Link>
      </div>
    </main>
  );
}
