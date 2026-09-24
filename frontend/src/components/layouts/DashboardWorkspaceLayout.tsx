import { Suspense, type ReactNode } from "react";
import { PageLoadingFallback } from "../common/PageLoadingFallback";

interface DashboardWorkspaceLayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export const DashboardWorkspaceLayout = ({
  sidebar,
  children,
}: DashboardWorkspaceLayoutProps) => (
  <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto lg:overflow-x-hidden lg:overflow-y-hidden lg:flex-row bg-slate-100 w-full max-w-full">
    {sidebar && (
      <aside className="mx-4 mt-4 w-auto flex max-h-64 shrink-0 flex-col gap-4 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm lg:my-4 lg:ml-5 lg:mr-0 lg:max-h-none lg:w-64 lg:min-w-[16rem]">
        {sidebar}
      </aside>
    )}
    <main className="min-w-0 max-w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-100 p-4 sm:p-5 lg:p-4 lg:px-5 xl:px-6 lg:pb-8 flex flex-col">
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </main>
  </div>
);

export default DashboardWorkspaceLayout;

