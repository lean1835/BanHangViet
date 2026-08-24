import React, { createContext, useContext, useState, type ReactNode } from "react";

export interface IAuditLogFilterState {
  username: string;
  action: string;
  targetTable: string;
  startDate: string;
  endDate: string;
}

export const initialAuditFilterState: IAuditLogFilterState = {
  username: "",
  action: "",
  targetTable: "",
  startDate: "",
  endDate: "",
};

interface IAuditLogFilterContextType {
  filter: IAuditLogFilterState;
  setFilter: React.Dispatch<React.SetStateAction<IAuditLogFilterState>>;
  handleFilterChange: (newFilter: Partial<IAuditLogFilterState>) => void;
  handleResetFilter: () => void;
}

const AuditLogFilterContext = createContext<IAuditLogFilterContextType | undefined>(undefined);

export const AuditLogFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filter, setFilter] = useState<IAuditLogFilterState>(initialAuditFilterState);

  const handleFilterChange = (newFilter: Partial<IAuditLogFilterState>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  const handleResetFilter = () => {
    setFilter(initialAuditFilterState);
  };

  return (
    <AuditLogFilterContext.Provider
      value={{ filter, setFilter, handleFilterChange, handleResetFilter }}
    >
      {children}
    </AuditLogFilterContext.Provider>
  );
};

export const useAuditLogFilter = () => {
  const context = useContext(AuditLogFilterContext);
  if (!context) {
    // Fallback if not inside Provider (e.g. isolated test or direct mount)
    return {
      filter: initialAuditFilterState,
      setFilter: () => {},
      handleFilterChange: () => {},
      handleResetFilter: () => {},
    };
  }
  return context;
};
