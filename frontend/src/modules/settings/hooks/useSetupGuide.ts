import { useState, useMemo, useCallback, useEffect } from "react";
import {
  type ISetupStep,
  type ISetupGuideProgress,
  INITIAL_SETUP_STEPS,
} from "../types/ISetupGuide";
import {
  useGetMyHouseholdQuery,
  useGetInvoiceTemplateQuery,
  useGetAllTaxRatesQuery,
  useGetOnboardingStatusQuery,
  useSkipOnboardingMutation,
  useCompleteOnboardingMutation,
} from "../services/settingsApi";
import { useGetProductsQuery } from "@/modules/product/services/productApi";
import { useGetAllEmployeesQuery } from "@/modules/employee/services/employeeApi";
import { useAppSelector } from "@/hooks/useRedux";
import { USER_ROLES } from "@/constants/roles";

const LEGACY_STORAGE_KEY_DISMISSED = "bhv_setup_guide_dismissed";
const STORAGE_KEY_MOCK_OVERRIDE = "bhv_setup_guide_mock_overrides";

export const getAccountDismissedKey = (userKey: string) => `bhv_setup_guide_dismissed_${userKey}`;
export const getAccountPermanentlyHiddenKey = (userKey: string) => `bhv_setup_guide_permanently_hidden_${userKey}`;
export const getAccountSkippedStepsKey = (userKey: string) => `bhv_setup_guide_skipped_steps_${userKey}`;
export const getAccountAutoOpenedKey = (userKey: string) => `bhv_setup_guide_auto_opened_${userKey}`;

export const useSetupGuide = () => {
  const authUser = useAppSelector((state) => state.auth.user);
  const userKey = authUser?.id ? String(authUser.id) : (authUser?.username || "default");

  // Query centralized backend onboarding status
  const { data: onboardingData, isLoading: isOnboardingLoading } = useGetOnboardingStatusQuery();
  const [skipOnboardingMutation] = useSkipOnboardingMutation();
  const [completeOnboardingMutation] = useCompleteOnboardingMutation();

  // Query component APIs as client-side fallback / real-time reactivity (chỉ query khi BE chưa trả về steps)
  const hasBeSteps = Boolean(onboardingData?.result?.steps?.length);
  const { data: householdData } = useGetMyHouseholdQuery(undefined, { skip: hasBeSteps });
  const { data: invoiceTemplateData } = useGetInvoiceTemplateQuery(undefined, { skip: hasBeSteps });
  const { data: taxRatesData } = useGetAllTaxRatesQuery(undefined, { skip: hasBeSteps });
  const { data: productsData } = useGetProductsQuery({ size: 1 }, { skip: hasBeSteps });
  const { data: employeesData } = useGetAllEmployeesQuery(undefined, { skip: hasBeSteps });

  const checkAccountDismissed = useCallback((key: string): boolean => {
    if (typeof window === "undefined") return false;
    const isPermanentlyHidden = localStorage.getItem(getAccountPermanentlyHiddenKey(key)) === "true";
    const isAccountDismissed = localStorage.getItem(getAccountDismissedKey(key)) === "true";
    const isLegacyDismissed = (key === "default" || key === "1") && localStorage.getItem(LEGACY_STORAGE_KEY_DISMISSED) === "true";
    return isPermanentlyHidden || isAccountDismissed || isLegacyDismissed;
  }, []);

  const checkAccountPermanentlyHidden = useCallback((key: string): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(getAccountPermanentlyHiddenKey(key)) === "true";
  }, []);

  const [isDismissed, setIsDismissed] = useState<boolean>(() => checkAccountDismissed(userKey));
  const [isPermanentlyHidden, setIsPermanentlyHidden] = useState<boolean>(() => checkAccountPermanentlyHidden(userKey));

  const [skippedSteps, setSkippedSteps] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(getAccountSkippedStepsKey(userKey));
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [mockOverrides, setMockOverrides] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOCK_OVERRIDE);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Re-sync state when user changes (e.g. login with another account)
  useEffect(() => {
    setIsDismissed(checkAccountDismissed(userKey));
    setIsPermanentlyHidden(checkAccountPermanentlyHidden(userKey));
    try {
      const stored = localStorage.getItem(getAccountSkippedStepsKey(userKey));
      setSkippedSteps(stored ? JSON.parse(stored) : []);
    } catch {
      setSkippedSteps([]);
    }
  }, [userKey, checkAccountDismissed, checkAccountPermanentlyHidden]);

  // Calculate actual completion of steps (Server First -> Fallback Client-side)
  const steps: ISetupStep[] = useMemo(() => {
    const beSteps = onboardingData?.result?.steps;
    const beStepMap = new Map<string, boolean>();
    if (Array.isArray(beSteps)) {
      beSteps.forEach((s) => {
        beStepMap.set(s.stepCode, s.isCompleted);
      });
    }

    return INITIAL_SETUP_STEPS.map((step) => {
      let isCompleted = false;

      // 1. Check Backend Onboarding Result first
      if (beStepMap.size > 0) {
        if (step.key === "HOUSEHOLD_INFO" && beStepMap.has("HOUSEHOLD_INFO")) {
          isCompleted = Boolean(beStepMap.get("HOUSEHOLD_INFO"));
        } else if (step.key === "INVOICE_TEMPLATE" && beStepMap.has("INVOICE_TEMPLATE")) {
          isCompleted = Boolean(beStepMap.get("INVOICE_TEMPLATE"));
        } else if (step.key === "TAX_RATE" && beStepMap.has("TAX_RATE")) {
          isCompleted = Boolean(beStepMap.get("TAX_RATE"));
        } else if (step.key === "INITIAL_PRODUCT" && beStepMap.has("PRODUCT")) {
          isCompleted = Boolean(beStepMap.get("PRODUCT"));
        } else if (step.key === "EMPLOYEE_ACCOUNT" && beStepMap.has("STAFF")) {
          isCompleted = Boolean(beStepMap.get("STAFF"));
        }
      } else {
        // 2. Fallback: Auto detection via component queries
        switch (step.key) {
          case "HOUSEHOLD_INFO": {
            const hh = householdData?.result;
            isCompleted = Boolean(hh?.name && hh?.taxCode && hh?.address && hh?.phoneNumber);
            break;
          }
          case "INVOICE_TEMPLATE": {
            const tmpl = invoiceTemplateData?.result;
            isCompleted = Boolean(tmpl?.invoicePattern && tmpl?.invoiceSymbol);
            break;
          }
          case "TAX_RATE": {
            const rates = taxRatesData?.result || [];
            isCompleted = rates.some((r) => r.isActive);
            break;
          }
          case "INITIAL_PRODUCT": {
            const count = productsData?.totalElements ?? productsData?.content?.length ?? 0;
            isCompleted = count > 0;
            break;
          }
          case "EMPLOYEE_ACCOUNT": {
            const empList = employeesData || [];
            isCompleted = empList.length > 0;
            break;
          }
        }
      }

      // 3. Mock override if provided
      if (mockOverrides[step.key] !== undefined) {
        isCompleted = mockOverrides[step.key];
      }

      // 4. Check if this step is explicitly skipped for this account
      const isSkipped = skippedSteps.includes(step.key);

      return {
        ...step,
        isCompleted,
        isSkipped,
      };
    });
  }, [onboardingData, householdData, invoiceTemplateData, taxRatesData, productsData, employeesData, mockOverrides, skippedSteps]);

  const requiredSteps = useMemo(() => steps.filter((s) => s.isRequired), [steps]);
  const completedRequired = useMemo(() => requiredSteps.filter((s) => s.isCompleted).length, [requiredSteps]);
  const skippedRequired = useMemo(() => requiredSteps.filter((s) => s.isSkipped && !s.isCompleted).length, [requiredSteps]);
  const completedTotal = useMemo(() => steps.filter((s) => s.isCompleted).length, [steps]);
  const skippedTotal = useMemo(() => steps.filter((s) => s.isSkipped && !s.isCompleted).length, [steps]);

  const isReadyForInvoice = (completedRequired + skippedRequired) >= requiredSteps.length;

  const effectiveIsPermanentlyHidden = useMemo(() => {
    if (typeof window === "undefined") return false;
    const isBeSkipped = Boolean(onboardingData?.result?.isSkipped);
    const isBeCompleted = Boolean(onboardingData?.result?.isCompleted);
    const isAllRequiredResolved = requiredSteps.length > 0 && (completedRequired + skippedRequired) >= requiredSteps.length;
    return isPermanentlyHidden || isBeSkipped || isBeCompleted || isAllRequiredResolved;
  }, [isPermanentlyHidden, onboardingData, requiredSteps.length, completedRequired, skippedRequired]);

  const skipStep = useCallback((stepKey: string) => {
    setSkippedSteps((prev) => {
      if (prev.includes(stepKey)) return prev;
      const next = [...prev, stepKey];
      localStorage.setItem(getAccountSkippedStepsKey(userKey), JSON.stringify(next));

      // If all required steps are now completed or skipped, permanently hide the banner
      const remainingIncomplete = requiredSteps.filter(
        (s) => s.key !== stepKey && !s.isCompleted && !next.includes(s.key)
      ).length;
      if (remainingIncomplete === 0) {
        setIsPermanentlyHidden(true);
        localStorage.setItem(getAccountPermanentlyHiddenKey(userKey), "true");
        localStorage.setItem(getAccountDismissedKey(userKey), "true");
        setIsDismissed(true);
      }

      return next;
    });
  }, [userKey, requiredSteps]);

  const unskipStep = useCallback((stepKey: string) => {
    setSkippedSteps((prev) => {
      const next = prev.filter((k) => k !== stepKey);
      localStorage.setItem(getAccountSkippedStepsKey(userKey), JSON.stringify(next));
      localStorage.removeItem(getAccountPermanentlyHiddenKey(userKey));
      setIsPermanentlyHidden(false);
      return next;
    });
  }, [userKey]);

  const dismissGuide = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(getAccountDismissedKey(userKey), "true");
    localStorage.setItem(LEGACY_STORAGE_KEY_DISMISSED, "true");
  }, [userKey]);

  const resetDismiss = useCallback(() => {
    setIsDismissed(false);
    setIsPermanentlyHidden(false);
    localStorage.removeItem(getAccountDismissedKey(userKey));
    localStorage.removeItem(getAccountPermanentlyHiddenKey(userKey));
    localStorage.removeItem(getAccountSkippedStepsKey(userKey));
    localStorage.removeItem(getAccountAutoOpenedKey(userKey));
    localStorage.removeItem(LEGACY_STORAGE_KEY_DISMISSED);
    setSkippedSteps([]);
  }, [userKey]);

  const skipGuideAsync = useCallback(async () => {
    dismissGuide();
    setIsPermanentlyHidden(true);
    localStorage.setItem(getAccountPermanentlyHiddenKey(userKey), "true");
    const allStepKeys = INITIAL_SETUP_STEPS.map((s) => s.key);
    setSkippedSteps(allStepKeys);
    localStorage.setItem(getAccountSkippedStepsKey(userKey), JSON.stringify(allStepKeys));

    // Only call backend if user is OWNER (VT-01)
    const isOwner =
      authUser?.roleId === USER_ROLES.OWNER ||
      authUser?.role?.code === "VT-01" ||
      !authUser?.roleId; // default fallback for tests

    if (isOwner) {
      try {
        await skipOnboardingMutation().unwrap();
      } catch {
        // Gracefully handle offline / demo mode
      }
    }
  }, [dismissGuide, userKey, authUser, skipOnboardingMutation]);

  const completeGuideAsync = useCallback(async () => {
    const isOwner =
      authUser?.roleId === USER_ROLES.OWNER ||
      authUser?.role?.code === "VT-01" ||
      !authUser?.roleId;

    if (isOwner) {
      try {
        await completeOnboardingMutation().unwrap();
      } catch {
        // Gracefully handle offline / demo mode
      }
    }
  }, [authUser, completeOnboardingMutation]);

  const markModalAutoOpened = useCallback(() => {
    localStorage.setItem(getAccountAutoOpenedKey(userKey), "true");
  }, [userKey]);

  const toggleMockStep = useCallback((key: string, value: boolean) => {
    setMockOverrides((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY_MOCK_OVERRIDE, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetMockOverrides = useCallback(() => {
    setMockOverrides({});
    localStorage.removeItem(STORAGE_KEY_MOCK_OVERRIDE);
    resetDismiss();
  }, [resetDismiss]);

  const effectiveIsDismissed = isDismissed || Boolean(onboardingData?.result?.isSkipped);

  const progress: ISetupGuideProgress = {
    totalSteps: steps.length,
    totalRequired: requiredSteps.length,
    completedRequired,
    skippedRequired,
    completedTotal,
    skippedTotal,
    isReadyForInvoice,
    isDismissed: effectiveIsDismissed,
    isPermanentlyHidden: effectiveIsPermanentlyHidden,
    steps,
  };

  return {
    progress,
    steps,
    isDismissed: effectiveIsDismissed,
    isPermanentlyHidden: effectiveIsPermanentlyHidden,
    isReadyForInvoice,
    isOnboardingLoading,
    userKey,
    skipStep,
    unskipStep,
    dismissGuide,
    resetDismiss,
    skipGuideAsync,
    completeGuideAsync,
    markModalAutoOpened,
    toggleMockStep,
    resetMockOverrides,
  };
};

