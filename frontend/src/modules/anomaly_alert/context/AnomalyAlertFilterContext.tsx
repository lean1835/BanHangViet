import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { IAnomalyAlertFilterParams } from "../types/IAnomalyAlert";

import { ANOMALY_UI } from "@/constants/anomalyAlert";

export const initialAnomalyFilterState: IAnomalyAlertFilterParams = {
  page: 0,
  size: ANOMALY_UI.TABLE.PAGE_SIZE || 9,
  keyword: "",
  severity: "",
  status: "",
  alertType: "",
  startDate: "",
  endDate: "",
};

interface IAnomalyAlertFilterContextType {
  filter: IAnomalyAlertFilterParams;
  setFilter: React.Dispatch<React.SetStateAction<IAnomalyAlertFilterParams>>;
  handleFilterChange: (newFilter: Partial<IAnomalyAlertFilterParams>) => void;
  handleResetFilter: () => void;
}

const AnomalyAlertFilterContext = createContext<
  IAnomalyAlertFilterContextType | undefined
>(undefined);

export const AnomalyAlertFilterProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [filter, setFilter] =
    useState<IAnomalyAlertFilterParams>(initialAnomalyFilterState);

  const handleFilterChange = (newFilter: Partial<IAnomalyAlertFilterParams>) => {
    setFilter((prev) => ({ ...prev, ...newFilter, page: 0 }));
  };

  const handleResetFilter = () => {
    setFilter(initialAnomalyFilterState);
  };

  return (
    <AnomalyAlertFilterContext.Provider
      value={{ filter, setFilter, handleFilterChange, handleResetFilter }}
    >
      {children}
    </AnomalyAlertFilterContext.Provider>
  );
};

export const useAnomalyAlertFilter = () => {
  const context = useContext(AnomalyAlertFilterContext);
  if (!context) {
    return {
      filter: initialAnomalyFilterState,
      setFilter: () => {},
      handleFilterChange: () => {},
      handleResetFilter: () => {},
    };
  }
  return context;
};
