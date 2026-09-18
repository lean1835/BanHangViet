import { useState } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import {
  DEFAULT_EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_FILTER_ALL,
  EMPLOYEE_STATUS_FILTERS,
  type TEmployeeStatusFilter,
} from "@/constants/employee";
import { USER_ROLES } from "@/constants/roles";
import { EmployeeList } from "../components/EmployeeList";
import { EmployeeSidebar } from "../components/EmployeeSidebar";
import { AccountantInvitationList } from "../components/AccountantInvitationList";
import { AccountantSidebar } from "../components/AccountantSidebar";
import { useGetAllEmployeesQuery } from "../services/employeeApi";

export const EmployeePage = () => {
  const { currentRole } = useDashboardDemo();
  const isOwner = currentRole === USER_ROLES.OWNER;
  const [activeTab, setActiveTab] = useState<"INTERNAL" | "OUTSOURCED">(
    "INTERNAL",
  );

  const {
    data: employees = [],
    isLoading,
    refetch,
  } = useGetAllEmployeesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Bộ lọc nhân viên nội bộ
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<TEmployeeStatusFilter>(EMPLOYEE_STATUS_FILTERS.ACTIVE);
  const [selectedRole, setSelectedRole] = useState(
    EMPLOYEE_ROLE_FILTER_ALL,
  );

  // Bộ lọc kế toán thuê ngoài
  const [accountantSearchQuery, setAccountantSearchQuery] = useState("");
  const [accountantStatusFilter, setAccountantStatusFilter] = useState("ALL");

  return (
    <DashboardWorkspaceLayout
      sidebar={
        activeTab === "INTERNAL" ? (
          <EmployeeSidebar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            roles={DEFAULT_EMPLOYEE_ROLES}
          />
        ) : (
          <AccountantSidebar
            searchQuery={accountantSearchQuery}
            setSearchQuery={setAccountantSearchQuery}
            statusFilter={accountantStatusFilter}
            setStatusFilter={setAccountantStatusFilter}
          />
        )
      }
    >
      <div className="flex flex-col gap-4 w-full flex-1 animate-page-fade">
        {/* Top Actions & Tabs Row */}
        {isOwner && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("INTERNAL")}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  activeTab === "INTERNAL"
                    ? "bg-white text-kv-blue-primary border border-slate-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
                }`}
              >
                Nhân viên nội bộ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("OUTSOURCED")}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  activeTab === "OUTSOURCED"
                    ? "bg-white text-kv-blue-primary border border-slate-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200/70"
                }`}
              >
                Kế toán thuê ngoài
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeTab === "INTERNAL" ? (
          <EmployeeList
            employees={employees}
            roles={DEFAULT_EMPLOYEE_ROLES}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            selectedRole={selectedRole}
            userRole={currentRole}
            isLoading={isLoading}
            refetch={refetch}
          />
        ) : (
          <AccountantInvitationList
            searchQuery={accountantSearchQuery}
            setSearchQuery={setAccountantSearchQuery}
            statusFilter={accountantStatusFilter}
            setStatusFilter={setAccountantStatusFilter}
          />
        )}
      </div>
    </DashboardWorkspaceLayout>
  );
};

export default EmployeePage;
