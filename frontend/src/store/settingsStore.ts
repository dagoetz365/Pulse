/**
 * Zustand store for user preferences, persisted to localStorage.
 *
 * Stores display name, notification toggles (email, SMS, push, critical
 * alerts), and UI preferences (compact mode). Changes are automatically
 * saved to `localStorage` under the key `"pulse-settings"` via the
 * Zustand `persist` middleware and survive page reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  displayName: string;
  email: string;
  role: string;

  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  criticalAlerts: boolean;

  compactMode: boolean;

  setDisplayName: (name: string) => void;
  setEmailNotifications: (on: boolean) => void;
  setSmsNotifications: (on: boolean) => void;
  setPushNotifications: (on: boolean) => void;
  setCriticalAlerts: (on: boolean) => void;
  setCompactMode: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      displayName: "Daniel Goetz",
      email: "d.goetz@pulse.health",
      role: "Administrator",

      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      criticalAlerts: true,

      compactMode: false,

      setDisplayName: (displayName) => set({ displayName }),
      setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
      setSmsNotifications: (smsNotifications) => set({ smsNotifications }),
      setPushNotifications: (pushNotifications) => set({ pushNotifications }),
      setCriticalAlerts: (criticalAlerts) => set({ criticalAlerts }),
      setCompactMode: (compactMode) => set({ compactMode }),
    }),
    {
      name: "pulse-settings",
    }
  )
);
