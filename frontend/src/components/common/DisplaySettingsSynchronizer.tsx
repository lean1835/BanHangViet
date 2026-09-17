import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useGetDisplaySettingsQuery } from "@/modules/settings/services/displaySettingApi";
import {
  setDisplaySettings,
  resetDisplaySettings,
  applyDisplaySettingsToDom,
} from "@/stores/displaySettingsSlice";

export const DisplaySettingsSynchronizer: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentSettings = useAppSelector((state) => state.displaySettings);

  const { data: displaySettingsResponse } = useGetDisplaySettingsQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  // Sync server display settings to Redux store & DOM on login / load
  useEffect(() => {
    if (isAuthenticated && displaySettingsResponse?.result) {
      dispatch(setDisplaySettings(displaySettingsResponse.result));
    } else if (!isAuthenticated) {
      dispatch(resetDisplaySettings());
    }
  }, [isAuthenticated, displaySettingsResponse, dispatch]);

  // Ensure DOM attributes match current state on mounts/changes
  useEffect(() => {
    applyDisplaySettingsToDom(currentSettings);
  }, [currentSettings]);

  return null;
};

export default DisplaySettingsSynchronizer;
