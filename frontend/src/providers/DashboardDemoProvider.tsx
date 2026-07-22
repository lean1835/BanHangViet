import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useAppSelector } from "@/hooks/useRedux";
import {
  APP_ERRORS,
  APP_FALLBACKS,
  DEMO_WORKSPACE_DEFAULTS,
  getNextActivityLogId,
} from "@/constants/app";
import {
  MOCK_ACTIVITY_LOGS,
  MOCK_CUSTOMERS,
  MOCK_INVOICES,
} from "@/constants/mockData";
import { useGetOrdersHistoryQuery } from "@/modules/order/services/orderApi";
import { isDemoRole, USER_ROLES } from "@/constants/roles";
import type { ICustomer } from "@/modules/customer/types/ICustomer";
import type { TDemoRole } from "@/constants/roles";
import type { IInvoice } from "@/modules/e_invoice/types/IInvoice";
import { MOCK_STOCK_ENTRIES } from "@/constants/mockData/product";
import type { IStockEntry } from "@/modules/product/types/IStockEntry";
import type { IOrderResponse } from "@/modules/order/types/IOrder";
import type { IActivityLog } from "@/modules/report/types/IActivityLog";
import { formatActivityTimestamp } from "@/utils/dateFormatter";

interface IDashboardDemoContext {
  currentRole: TDemoRole;
  setCurrentRole: Dispatch<SetStateAction<TDemoRole>>;
  isOnline: boolean;
  setIsOnline: Dispatch<SetStateAction<boolean>>;
  simConflict: boolean;
  setSimConflict: Dispatch<SetStateAction<boolean>>;
  invoices: IInvoice[];
  setInvoices: Dispatch<SetStateAction<IInvoice[]>>;
  customers: ICustomer[];
  setCustomers: Dispatch<SetStateAction<ICustomer[]>>;
  logs: IActivityLog[];
  addLogEntry: (action: string, target: string) => void;
  stockEntries: IStockEntry[];
  setStockEntries: Dispatch<SetStateAction<IStockEntry[]>>;
  orders: IOrderResponse[];
  setOrders: Dispatch<SetStateAction<IOrderResponse[]>>;
  isOrdersLoading: boolean;
  isOrdersError: boolean;
  ordersError: unknown;
  refetchOrders: () => void;
}

const DashboardDemoContext = createContext<IDashboardDemoContext | null>(null);

interface DashboardDemoProviderProps {
  children: ReactNode;
}

export const DashboardDemoProvider = ({ children }: DashboardDemoProviderProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const [currentRole, setCurrentRole] = useState<TDemoRole>(
    isDemoRole(user?.roleId) ? user.roleId : USER_ROLES.OWNER
  );
  const [isOnline, setIsOnline] = useState<boolean>(
    DEMO_WORKSPACE_DEFAULTS.IS_ONLINE,
  );
  const [simConflict, setSimConflict] = useState<boolean>(
    DEMO_WORKSPACE_DEFAULTS.SIMULATE_CONFLICT,
  );
  const [invoices, setInvoices] = useState<IInvoice[]>(() => [...MOCK_INVOICES]);
  const [customers, setCustomers] = useState<ICustomer[]>(() => [...MOCK_CUSTOMERS]);
  const [logs, setLogs] = useState<IActivityLog[]>(() => [...MOCK_ACTIVITY_LOGS]);
  const [stockEntries, setStockEntries] = useState<IStockEntry[]>(() => [
    ...MOCK_STOCK_ENTRIES,
  ]);
  const [orders, setOrders] = useState<IOrderResponse[]>([]);

  const canFetchOrders = Boolean(
    user?.roleId &&
      (user.roleId === USER_ROLES.OWNER ||
        user.roleId === USER_ROLES.CASHIER ||
        user.roleId === USER_ROLES.ACCOUNTANT) &&
      user?.household != null
  );

  const {
    data: apiOrdersData,
    error: ordersError,
    isError: isOrdersError,
    isLoading: isOrdersLoading,
    refetch: refetchOrdersQuery,
  } = useGetOrdersHistoryQuery(undefined, { skip: !isOnline || !canFetchOrders });

  useEffect(() => {
    if (isOnline && apiOrdersData?.result) {
      setOrders(apiOrdersData.result);
    }
  }, [apiOrdersData, isOnline]);

  const refetchOrders = useCallback(() => {
    if (isOnline) void refetchOrdersQuery();
  }, [isOnline, refetchOrdersQuery]);

  const addLogEntry = useCallback(
    (action: string, target: string) => {
      setLogs((currentLogs) => [
        {
          id: getNextActivityLogId(currentLogs.length),
          time: formatActivityTimestamp(new Date()),
          user: user?.username || APP_FALLBACKS.USERNAME,
          action,
          target,
        },
        ...currentLogs,
      ]);
    },
    [user?.username]
  );

  const value = useMemo<IDashboardDemoContext>(
    () => ({
      currentRole,
      setCurrentRole,
      isOnline,
      setIsOnline,
      simConflict,
      setSimConflict,
      invoices,
      setInvoices,
      customers,
      setCustomers,
      logs,
      addLogEntry,
      stockEntries,
      setStockEntries,
      orders,
      setOrders,
      isOrdersLoading,
      isOrdersError,
      ordersError,
      refetchOrders,
    }),
    [
      currentRole,
      isOnline,
      simConflict,
      invoices,
      customers,
      logs,
      addLogEntry,
      stockEntries,
      orders,
      isOrdersLoading,
      isOrdersError,
      ordersError,
      refetchOrders,
    ]
  );

  return <DashboardDemoContext.Provider value={value}>{children}</DashboardDemoContext.Provider>;
};

export const useDashboardDemo = (): IDashboardDemoContext => {
  const context = useContext(DashboardDemoContext);

  if (!context) {
    throw new Error(APP_ERRORS.DEMO_PROVIDER_REQUIRED);
  }

  return context;
};
