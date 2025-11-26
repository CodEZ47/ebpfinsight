import "./globals.css";
import "github-markdown-css/github-markdown.css";

export const metadata = {
  title: "eBPF Insight",
  description: "Repo analysis and overhead tests",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <div className="container mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
