import { useMemo } from "react";
import { USER_ROLES } from "@/constants/roles";
import { useGetMyHouseholdQuery } from "@/modules/settings/services/settingsApi";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";

export interface IValidationResult {
  canExport: boolean;
  isMissingInfo: boolean;
  missingFields: string[];
  roleAllowed: boolean;
  roleRestrictionReason?: string;
  householdData?: {
    name: string;
    taxCode: string;
    representativeName?: string;
    address: string;
    phoneNumber: string;
  };
}

export const useTaxPeriodValidation = (): IValidationResult => {
  const { currentRole } = useDashboardDemo();
  const { data: householdResponse } = useGetMyHouseholdQuery();
  const household = householdResponse?.result;

  return useMemo(() => {
    // 1. Kiểm tra vai trò người dùng (VT-01 Chủ hộ & VT-03 Kế toán được phép - TC-03)
    const roleAllowed =
      currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;

    const roleRestrictionReason = !roleAllowed
      ? "Chỉ Kế toán (VT-03) và Chủ hộ kinh doanh (VT-01) mới có quyền xuất tờ khai thuế."
      : undefined;

    // 2. Kiểm tra thông tin hồ sơ hộ kinh doanh (MST & Người đại diện - TC-02)
    const missingFields: string[] = [];

    const taxCode = household?.taxCode?.trim() || "";
    const representativeName = household?.representativeName?.trim() || "";

    if (!taxCode) {
      missingFields.push("Mã số thuế");
    }
    if (!representativeName) {
      missingFields.push("Người đại diện hộ kinh doanh");
    }

    const isMissingInfo = missingFields.length > 0;
    const canExport = roleAllowed && !isMissingInfo;

    return {
      canExport,
      isMissingInfo,
      missingFields,
      roleAllowed,
      roleRestrictionReason,
      householdData: household
        ? {
            name: household.name || "Hộ kinh doanh Bán Hàng Việt",
            taxCode: household.taxCode || "",
            representativeName: household.representativeName || "",
            address: household.address || "Việt Nam",
            phoneNumber: household.phoneNumber || "",
          }
        : undefined,
    };
  }, [currentRole, household]);
};
