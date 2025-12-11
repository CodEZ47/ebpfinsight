import "./globals.css";
import "github-markdown-css/github-markdown.css";
import DashboardSidebar from "../components/DashboardSidebar";
import ThemeToggle from "../components/ThemeToggle";
import { SnackbarProvider } from "../components/SnackbarProvider";

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
      <head>
        {/* Preload theme before paint for no-flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = stored ? stored === 'dark' : prefersDark;
    if (useDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch {}
})();`,
          }}
        />
      </head>
      <body className="bg-gradient-to-br from-emerald-50 via-white to-white text-slate-900 antialiased dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 dark:text-slate-100">
        <SnackbarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <div className="sticky top-0 h-screen max-w-[268px] flex-none overflow-y-auto border-r border-emerald-100 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
              <DashboardSidebar />
            </div>
            <main className="relative flex-1 overflow-y-auto bg-transparent">
              <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/85 px-8 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Operations overview
                    </p>
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Keep your eBPF intelligence up to date
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Review analytics, trigger analyses, and manage your
                      repository catalog.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm md:flex dark:border-slate-800 dark:bg-slate-900">
                      <span className="text-emerald-500">Shift + /</span>
                      &nbsp;Search anytime
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="relative z-20 px-8 pb-12 pt-8">
                <div className="fade-in space-y-8">{children}</div>
              </div>
            </main>
          </div>
        </SnackbarProvider>
      </body>
    </html>
  );
}
