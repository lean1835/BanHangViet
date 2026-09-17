import { useState, useMemo, useCallback } from "react";
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

const STORAGE_KEY_DISMISSED = "bhv_setup_guide_dismissed";
const STORAGE_KEY_MOCK_OVERRIDE = "bhv_setup_guide_mock_overrides";

export const useSetupGuide = () => {
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

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_DISMISSED) === "true";
  });

  const [mockOverrides, setMockOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOCK_OVERRIDE);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

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

      return {
        ...step,
        isCompleted,
      };
    });
  }, [onboardingData, householdData, invoiceTemplateData, taxRatesData, productsData, employeesData, mockOverrides]);

  const requiredSteps = useMemo(() => steps.filter((s) => s.isRequired), [steps]);
  const completedRequired = useMemo(() => requiredSteps.filter((s) => s.isCompleted).length, [requiredSteps]);
  const completedTotal = useMemo(() => steps.filter((s) => s.isCompleted).length, [steps]);

  const isReadyForInvoice = completedRequired === requiredSteps.length;

  const dismissGuide = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY_DISMISSED, "true");
  }, []);

  const resetDismiss = useCallback(() => {
    setIsDismissed(false);
    localStorage.removeItem(STORAGE_KEY_DISMISSED);
  }, []);

  const skipGuideAsync = useCallback(async () => {
    dismissGuide();
    try {
      await skipOnboardingMutation().unwrap();
    } catch {
      // Gracefully handle offline / demo mode
    }
  }, [dismissGuide, skipOnboardingMutation]);

  const completeGuideAsync = useCallback(async () => {
    try {
      await completeOnboardingMutation().unwrap();
    } catch {
      // Gracefully handle offline / demo mode
    }
  }, [completeOnboardingMutation]);

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
    localStorage.removeItem(STORAGE_KEY_DISMISSED);
    setIsDismissed(false);
  }, []);

  const progress: ISetupGuideProgress = {
    totalSteps: steps.length,
    totalRequired: requiredSteps.length,
    completedRequired,
    completedTotal,
    isReadyForInvoice,
    isDismissed: isDismissed || Boolean(onboardingData?.result?.isSkipped),
    steps,
  };

  return {
    progress,
    steps,
    isDismissed: isDismissed || Boolean(onboardingData?.result?.isSkipped),
    isReadyForInvoice,
    isOnboardingLoading,
    dismissGuide,
    resetDismiss,
    skipGuideAsync,
    completeGuideAsync,
    toggleMockStep,
    resetMockOverrides,
  };
};

