import type { ReactNode } from "react";

interface DashboardWorkspaceLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const DashboardWorkspaceLayout = ({
  sidebar,
  children,
}: DashboardWorkspaceLayoutProps) => (
  <div className="flex-1 flex overflow-hidden">
    <aside className="w-60 bg-white border border-slate-200 rounded-xl my-3 ml-3 p-4 shrink-0 flex flex-col gap-5 overflow-y-auto shadow-sm">
      {sidebar}
    </aside>
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">{children}</main>
  </div>
);
