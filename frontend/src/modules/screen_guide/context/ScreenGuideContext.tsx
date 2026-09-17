import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useLocation } from "react-router-dom";
import { getScreenCodeFromPath } from "../utils/screenRouteMapper";

interface IScreenGuideContext {
  isOpen: boolean;
  activeScreenCode: string | null;
  currentStepIndex: number;
  isHighlightEnabled: boolean;
  isDirectoryOpen: boolean;
  openGuide: (customScreenCode?: string) => void;
  closeGuide: () => void;
  nextStep: (maxSteps: number) => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  toggleHighlight: () => void;
  openDirectory: () => void;
  closeDirectory: () => void;
}

const ScreenGuideContext = createContext<IScreenGuideContext | undefined>(
  undefined
);

export const ScreenGuideProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [customScreenCode, setCustomScreenCode] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isHighlightEnabled, setIsHighlightEnabled] = useState(true);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);

  // Mã màn hình tự động xác định từ URL hiện tại nếu không chỉ định custom
  const pathScreenCode = useMemo(() => {
    return getScreenCodeFromPath(location.pathname);
  }, [location.pathname]);

  const activeScreenCode = customScreenCode || pathScreenCode;

  const openGuide = useCallback((targetScreenCode?: string) => {
    if (targetScreenCode) {
      setCustomScreenCode(targetScreenCode);
    } else {
      setCustomScreenCode(null);
    }
    setCurrentStepIndex(0);
    setIsOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setIsOpen(false);
    setCustomScreenCode(null);
  }, []);

  const nextStep = useCallback((maxSteps: number) => {
    setCurrentStepIndex((prev) => (prev + 1 < maxSteps ? prev + 1 : prev));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStepIndex(Math.max(0, index));
  }, []);

  const toggleHighlight = useCallback(() => {
    setIsHighlightEnabled((prev) => !prev);
  }, []);

  const openDirectory = useCallback(() => {
    setIsDirectoryOpen(true);
  }, []);

  const closeDirectory = useCallback(() => {
    setIsDirectoryOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeScreenCode,
      currentStepIndex,
      isHighlightEnabled,
      isDirectoryOpen,
      openGuide,
      closeGuide,
      nextStep,
      prevStep,
      goToStep,
      toggleHighlight,
      openDirectory,
      closeDirectory,
    }),
    [
      isOpen,
      activeScreenCode,
      currentStepIndex,
      isHighlightEnabled,
      isDirectoryOpen,
      openGuide,
      closeGuide,
      nextStep,
      prevStep,
      goToStep,
      toggleHighlight,
      openDirectory,
      closeDirectory,
    ]
  );

  return (
    <ScreenGuideContext.Provider value={value}>
      {children}
    </ScreenGuideContext.Provider>
  );
};

const defaultContextValue: IScreenGuideContext = {
  isOpen: false,
  activeScreenCode: null,
  currentStepIndex: 0,
  isHighlightEnabled: false,
  isDirectoryOpen: false,
  openGuide: () => {},
  closeGuide: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  toggleHighlight: () => {},
  openDirectory: () => {},
  closeDirectory: () => {},
};

export const useScreenGuide = (): IScreenGuideContext => {
  const context = useContext(ScreenGuideContext);
  return context || defaultContextValue;
};
