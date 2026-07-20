import type { ReactNode } from "react";

interface DashboardWorkspaceLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const DashboardWorkspaceLayout = ({
  sidebar,
  children,
}: DashboardWorkspaceLayoutProps) => (
  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
    <aside className="mx-3 mt-3 flex max-h-64 shrink-0 flex-col gap-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:my-3 lg:ml-3 lg:mr-0 lg:max-h-none lg:w-60">
      {sidebar}
    </aside>
    <main className="min-w-0 flex-1 overflow-y-visible bg-slate-50 p-3 sm:p-4 lg:overflow-y-auto lg:p-6">{children}</main>
  </div>
);
