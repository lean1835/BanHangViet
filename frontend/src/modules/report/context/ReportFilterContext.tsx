import React, { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from "react";
import { getLocalDateString } from "@/utils/dateFormatter";

// ==========================================
// 1. REVENUE REPORT FILTER
// ==========================================
export interface IRevenueFilterState {
  fromDate: string;
  toDate: string;
  activePreset: "today" | "last7days" | "thisMonth" | "custom";
}

export const getRevenuePresetDates = (preset: "today" | "last7days" | "thisMonth") => {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (preset === "today") {
    return { fromDate: todayStr, toDate: todayStr };
  }
  if (preset === "last7days") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { fromDate: getLocalDateString(d), toDate: todayStr };
  }
  // thisMonth
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    fromDate: getLocalDateString(firstDay),
    toDate: todayStr,
  };
};

// ==========================================
// 2. COMPARISON REPORT FILTER
// ==========================================
export interface IComparisonFilterState {
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
  activePreset: "monthVsMonth" | "weekVsWeek" | "custom";
}

export const getComparisonPresetPeriods = (preset: "monthVsMonth" | "weekVsWeek") => {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (preset === "weekVsWeek") {
    const p2Start = new Date(now);
    p2Start.setDate(now.getDate() - 6);

    const p1End = new Date(now);
    p1End.setDate(now.getDate() - 7);
    const p1Start = new Date(now);
    p1Start.setDate(now.getDate() - 13);

    return {
      period1Start: getLocalDateString(p1Start),
      period1End: getLocalDateString(p1End),
      period2Start: getLocalDateString(p2Start),
      period2End: todayStr,
    };
  }

  // monthVsMonth: Last month vs This month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    period1Start: getLocalDateString(lastMonthStart),
    period1End: getLocalDateString(lastMonthEnd),
    period2Start: getLocalDateString(thisMonthStart),
    period2End: todayStr,
  };
};

// ==========================================
// 3. ACTIVITY LOG FILTER
// ==========================================
export interface IActivityLogFilterState {
  fromDate: string;
  toDate: string;
}

// ==========================================
// UNIFIED REPORT CONTEXT
// ==========================================
interface IReportFilterContextType {
  // Revenue
  revenueFilter: IRevenueFilterState;
  setRevenueFilter: React.Dispatch<React.SetStateAction<IRevenueFilterState>>;
  setRevenuePreset: (preset: "today" | "last7days" | "thisMonth") => void;

  // Comparison
  comparisonFilter: IComparisonFilterState;
  setComparisonFilter: React.Dispatch<React.SetStateAction<IComparisonFilterState>>;
  setComparisonPreset: (preset: "monthVsMonth" | "weekVsWeek") => void;

  // Activity Log
  activityLogFilter: IActivityLogFilterState;
  setActivityLogFilter: React.Dispatch<React.SetStateAction<IActivityLogFilterState>>;
  setActivityLogPreset: (preset: "today" | "7days" | "thisMonth" | "all") => void;
  resetActivityLogFilter: () => void;
}

const ReportFilterContext = createContext<IReportFilterContextType | undefined>(undefined);

export const ReportFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Revenue
  const initialRevenueDates = useMemo(() => getRevenuePresetDates("thisMonth"), []);
  const [revenueFilter, setRevenueFilter] = useState<IRevenueFilterState>({
    fromDate: initialRevenueDates.fromDate,
    toDate: initialRevenueDates.toDate,
    activePreset: "thisMonth",
  });

  const setRevenuePreset = useCallback((preset: "today" | "last7days" | "thisMonth") => {
    const dates = getRevenuePresetDates(preset);
    setRevenueFilter({
      fromDate: dates.fromDate,
      toDate: dates.toDate,
      activePreset: preset,
    });
  }, []);

  // 2. Comparison
  const initialComparison = useMemo(() => getComparisonPresetPeriods("monthVsMonth"), []);
  const [comparisonFilter, setComparisonFilter] = useState<IComparisonFilterState>({
    ...initialComparison,
    activePreset: "monthVsMonth",
  });

  const setComparisonPreset = useCallback((preset: "monthVsMonth" | "weekVsWeek") => {
    const periods = getComparisonPresetPeriods(preset);
    setComparisonFilter({
      ...periods,
      activePreset: preset,
    });
  }, []);

  // 3. Activity Log
  const [activityLogFilter, setActivityLogFilter] = useState<IActivityLogFilterState>({
    fromDate: "",
    toDate: "",
  });

  const setActivityLogPreset = useCallback((preset: "today" | "7days" | "thisMonth" | "all") => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "today") {
      const dStr = formatDate(today);
      setActivityLogFilter({ fromDate: dStr, toDate: dStr });
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setActivityLogFilter({ fromDate: formatDate(past), toDate: formatDate(today) });
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setActivityLogFilter({ fromDate: formatDate(firstDay), toDate: formatDate(today) });
    } else if (preset === "all") {
      setActivityLogFilter({ fromDate: "", toDate: "" });
    }
  }, []);

  const resetActivityLogFilter = useCallback(() => {
    setActivityLogFilter({ fromDate: "", toDate: "" });
  }, []);

  const contextValue = useMemo(
    () => ({
      revenueFilter,
      setRevenueFilter,
      setRevenuePreset,
      comparisonFilter,
      setComparisonFilter,
      setComparisonPreset,
      activityLogFilter,
      setActivityLogFilter,
      setActivityLogPreset,
      resetActivityLogFilter,
    }),
    [
      revenueFilter,
      setRevenuePreset,
      comparisonFilter,
      setComparisonPreset,
      activityLogFilter,
      setActivityLogPreset,
      resetActivityLogFilter,
    ]
  );

  return (
    <ReportFilterContext.Provider value={contextValue}>
      {children}
    </ReportFilterContext.Provider>
  );
};

export const useReportFilter = () => {
  const context = useContext(ReportFilterContext);
  if (!context) {
    throw new Error("useReportFilter must be used within a ReportFilterProvider");
  }
  return context;
};
