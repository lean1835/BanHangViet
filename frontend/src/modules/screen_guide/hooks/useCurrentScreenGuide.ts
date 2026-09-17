import { useScreenGuide } from "../context/ScreenGuideContext";
import { useGetGuideByScreenCodeQuery } from "../api/screenGuideApi";
import { DEFAULT_SCREEN_GUIDES } from "../data/defaultScreenGuides";

export const useCurrentScreenGuide = () => {
  const guideContext = useScreenGuide();
  const { activeScreenCode, isOpen } = guideContext;

  const {
    data: guideResponse,
    isLoading,
    isError,
    refetch,
  } = useGetGuideByScreenCodeQuery(activeScreenCode || "", {
    skip: !activeScreenCode || !isOpen,
  });

  const apiGuide = guideResponse?.result;
  const fallbackGuide = activeScreenCode ? DEFAULT_SCREEN_GUIDES[activeScreenCode] : null;
  const guide = apiGuide || fallbackGuide;

  return {
    ...guideContext,
    guide,
    isLoading: isLoading && !fallbackGuide,
    isError: isError && !fallbackGuide,
    refetch,
  };
};
