import type { ReactNode } from "react";

interface DashboardWorkspaceLayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export const DashboardWorkspaceLayout = ({
  sidebar,
  children,
}: DashboardWorkspaceLayoutProps) => (
  <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row bg-slate-100">
    {sidebar && (
      <aside className="mx-4 mt-4 flex max-h-64 shrink-0 flex-col gap-5 overflow-y-auto no-scrollbar rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm lg:my-4 lg:ml-5 lg:mr-0 lg:max-h-none lg:w-64">
        {sidebar}
      </aside>
    )}
    <main className="min-w-0 flex-1 overflow-y-auto no-scrollbar bg-slate-100 p-4 sm:p-5 lg:p-4 lg:px-6 lg:pb-4 flex flex-col">
      {children}
    </main>
  </div>
);
