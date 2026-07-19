import { useState } from "react";
import { DashboardWorkspaceLayout } from "@/components/layouts/DashboardWorkspaceLayout";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import {
  DEFAULT_EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_FILTER_ALL,
  EMPLOYEE_STATUS_FILTERS,
  type TEmployeeStatusFilter,
} from "@/constants/employee";
import { EmployeeList } from "../components/EmployeeList";
import { EmployeeSidebar } from "../components/EmployeeSidebar";
import { useGetAllEmployeesQuery } from "../services/employeeApi";

export const EmployeePage = () => {
  const { currentRole } = useDashboardDemo();
  const { data: employees = [] } = useGetAllEmployeesQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<TEmployeeStatusFilter>(EMPLOYEE_STATUS_FILTERS.ACTIVE);
  const [selectedRole, setSelectedRole] = useState(
    EMPLOYEE_ROLE_FILTER_ALL,
  );

  return (
    <DashboardWorkspaceLayout
      sidebar={
        <EmployeeSidebar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          roles={DEFAULT_EMPLOYEE_ROLES}
        />
      }
    >
      <EmployeeList
        employees={employees}
        roles={DEFAULT_EMPLOYEE_ROLES}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        selectedRole={selectedRole}
        userRole={currentRole}
      />
    </DashboardWorkspaceLayout>
  );
};

export default EmployeePage;
