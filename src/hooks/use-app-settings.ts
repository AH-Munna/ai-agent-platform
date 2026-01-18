import { useEffect, useState } from "react";

export interface AppSettings {
  nvidiaApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  nvidiaApiKey: "",
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app_settings");
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("app_settings", JSON.stringify(newSettings));
  };

  return { settings, saveSettings, isLoaded };
}
