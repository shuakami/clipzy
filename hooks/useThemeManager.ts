import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export const usePrefersDarkMode = () => {
  const { setTheme, resolvedTheme } = useNextTheme();
  const [dark, setDarkState] = useState(resolvedTheme === "dark");

  useEffect(() => {
    setDarkState(resolvedTheme === "dark");
  }, [resolvedTheme]);

  const setDark = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
  };

  return [dark, setDark] as const;
};

export const useTheme = (isDark: boolean) => {
  return {
    bg: isDark ? "bg-zinc-900" : "bg-white",
    textPrimary: isDark ? "text-white" : "text-zinc-900",
    textSecondary: isDark ? "text-neutral-400" : "text-neutral-600",
    btnPrimary: isDark ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white",
    btnSecondary: isDark ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-neutral-200 hover:bg-neutral-300 text-zinc-900",
  };
}; 