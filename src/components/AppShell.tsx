import Link from "next/link";
import {
  Activity,
  Bot,
  Download,
  FileText,
  FlaskConical,
  GitBranch,
  Layers3,
  ListOrdered,
  Network,
  Plus,
  Upload,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Pool", icon: Layers3 },
  { href: "/nodes", label: "Nodes", icon: FlaskConical },
  { href: "/graph", label: "Graph", icon: GitBranch },
  { href: "/flow", label: "Flow", icon: ListOrdered },
  { href: "/ai-pool", label: "AI Pool", icon: Bot },
  { href: "/sandbox", label: "Sandbox", icon: FlaskConical },
  { href: "/ecosystem", label: "Ecosystem", icon: Network },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/corpus", label: "Corpus", icon: FileText },
  { href: "/observe", label: "Observe", icon: Activity },
  { href: "/backup", label: "Backup", icon: Download },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-[#fbfbf7]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-lime-300 text-stone-950">
              <FlaskConical size={21} aria-hidden />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-normal">
                Crystal Pool
              </span>
              <span className="block text-sm text-stone-500">
                A phase-transition engine for meaning
              </span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
              >
                <item.icon size={16} aria-hidden />
                {item.label}
              </Link>
            ))}
            <Link
              href="/nodes/new"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800"
            >
              <Plus size={16} aria-hidden />
              Add Fragment
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
    </div>
  );
}
