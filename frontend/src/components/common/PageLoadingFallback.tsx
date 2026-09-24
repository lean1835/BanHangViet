import React from "react";

export const PageLoadingFallback: React.FC = () => {
  return (
    <div className="w-full space-y-5 animate-pulse p-1 select-none">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded-lg" />
          <div className="h-3 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* KPI Cards Skeleton (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-7 w-28 bg-slate-200 rounded-lg" />
            <div className="h-2.5 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-slate-100 rounded-lg" />
            <div className="h-8 w-24 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* Table/Card lines */}
        <div className="space-y-2.5 pt-1">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-slate-200 rounded" />
                <div className="h-3.5 w-36 bg-slate-200 rounded" />
                <div className="h-3 w-20 bg-slate-100 rounded hidden sm:block" />
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3.5 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-16 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
