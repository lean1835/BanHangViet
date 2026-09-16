import { describe, it, expect } from "vitest";
import {
  mapScopeFeToScopeBe,
  mapScopeBeToScopeFe,
  calculateDaysUntil,
  accountantInvitationApi,
} from "@/modules/employee/services/accountantInvitationApi";
import { platformAdminApi } from "@/modules/platform_admin/services/platformAdminApi";
import { ACCESS_SCOPES } from "@/modules/employee/types/IAccountantInvitation";

describe("API Contract & Helper Mapping Unit Tests", () => {
  describe("Accountant Scope & Expiry Mappings", () => {
    it("maps FE scope constants to BE scope permissions correctly", () => {
      expect(mapScopeFeToScopeBe(ACCESS_SCOPES.E_INVOICES)).toBe("INVOICE");
      expect(mapScopeFeToScopeBe(ACCESS_SCOPES.FINANCIAL_REPORTS)).toBe("REPORT");
      expect(mapScopeFeToScopeBe(ACCESS_SCOPES.TAX_DECLARATION)).toBe("TAX_DECLARATION");
      expect(mapScopeFeToScopeBe("UNKNOWN_SCOPE")).toBe("UNKNOWN_SCOPE");
    });

    it("maps BE scope permissions back to FE scope constants correctly", () => {
      expect(mapScopeBeToScopeFe("INVOICE")).toBe(ACCESS_SCOPES.E_INVOICES);
      expect(mapScopeBeToScopeFe("REPORT")).toBe(ACCESS_SCOPES.FINANCIAL_REPORTS);
      expect(mapScopeBeToScopeFe("TAX_DECLARATION")).toBe(ACCESS_SCOPES.TAX_DECLARATION);
    });

    it("calculates days until expiry date properly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      const str = futureDate.toISOString().split("T")[0];

      const days = calculateDaysUntil(str);
      expect(days).toBeGreaterThanOrEqual(44);
      expect(days).toBeLessThanOrEqual(46);

      // Empty fallback
      expect(calculateDaysUntil("")).toBe(30);
    });
  });

  describe("RTK Query Endpoint Registrations", () => {
    it("accountantInvitationApi has all required real endpoints defined", () => {
      const endpoints = accountantInvitationApi.endpoints;
      expect(endpoints.getAccountantInvitations).toBeDefined();
      expect(endpoints.inviteAccountant).toBeDefined();
      expect(endpoints.revokeAccountantAccess).toBeDefined();
      expect(endpoints.extendAccountantAccess).toBeDefined();
      expect(endpoints.resendAccountantInvitation).toBeDefined();
      expect(endpoints.getAuthorizedHouseholds).toBeDefined();
      expect(endpoints.switchHousehold).toBeDefined();
    });

    it("platformAdminApi has all required real endpoints defined", () => {
      const endpoints = platformAdminApi.endpoints;
      expect(endpoints.getAdminHouseholds).toBeDefined();
      expect(endpoints.lockHousehold).toBeDefined();
      expect(endpoints.unlockHousehold).toBeDefined();
      expect(endpoints.getSubscriptionPlans).toBeDefined();
      expect(endpoints.changeHouseholdSubscription).toBeDefined();
      expect(endpoints.getPlatformSystemLogs).toBeDefined();
      expect(endpoints.getActiveIncident).toBeDefined();
      expect(endpoints.dismissIncident).toBeDefined();
    });
  });
});
