"use client";

import { Check, Loader2, Palette, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  applyBrandTheme,
  BRAND_THEME_ROLES,
  BRAND_THEME_STORAGE_KEY,
  DEFAULT_BRAND_THEME,
  normalizeBrandTheme,
  type ThemeRole,
  type ThemeValues,
} from "@/lib/brand-theme";

type ColorGroup = {
  name: string;
  colors: string[];
};

const COLOR_GROUPS: ColorGroup[] = [
  {
    name: "Current site",
    colors: ["#006937", "#0D793D", "#103C1E", "#083D1B", "#021D0D", "#4D4D4D", "#F2F2F2"],
  },
  {
    name: "PDF brand swatches",
    colors: [
      "#C1272D",
      "#ED1C24",
      "#F15A24",
      "#F7931E",
      "#FBB03B",
      "#FCEE21",
      "#D9E021",
      "#8CC63F",
      "#39B54A",
      "#009245",
      "#006837",
      "#22B573",
      "#00A99D",
      "#29ABE2",
      "#0071BC",
      "#2E3192",
      "#1B1464",
      "#662D91",
      "#93278F",
      "#9E005D",
      "#D4145A",
      "#ED1E79",
      "#C7B299",
      "#998675",
      "#736357",
      "#534741",
      "#C69C6D",
      "#A67C52",
      "#8C6239",
      "#754C24",
      "#603813",
      "#42210B",
    ],
  },
  {
    name: "PDF grays",
    colors: [
      "#000000",
      "#1A1A1A",
      "#333333",
      "#4D4D4D",
      "#666666",
      "#808080",
      "#999999",
      "#B3B3B3",
      "#CCCCCC",
      "#E6E6E6",
      "#F2F2F2",
      "#FFFFFF",
    ],
  },
  {
    name: "PDF web color group",
    colors: ["#3FA9F5", "#7AC943", "#FF931E", "#FF1D25", "#FF7BAC", "#BDCCD4"],
  },
  {
    name: "PDF base RGB",
    colors: ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"],
  },
];

const PRESETS: Array<{ name: string; values: ThemeValues }> = [
  {
    name: "Current",
    values: DEFAULT_BRAND_THEME,
  },
  {
    name: "PDF Green",
    values: {
      primaryText: "#006837",
      secondaryText: "#4D4D4D",
      primaryAccent: "#8CC63F",
      surfaceTint: "#E6E6E6",
      buttonPrimary: "#009245",
      buttonHover: "#006837",
      footerStart: "#006837",
      footerEnd: "#000000",
    },
  },
  {
    name: "Web Bright",
    values: {
      primaryText: "#006837",
      secondaryText: "#666666",
      primaryAccent: "#7AC943",
      surfaceTint: "#BDCCD4",
      buttonPrimary: "#7AC943",
      buttonHover: "#009245",
      footerStart: "#006837",
      footerEnd: "#1A1A1A",
    },
  },
  {
    name: "Brass",
    values: {
      primaryText: "#006837",
      secondaryText: "#736357",
      primaryAccent: "#C69C6D",
      surfaceTint: "#C7B299",
      buttonPrimary: "#8C6239",
      buttonHover: "#42210B",
      footerStart: "#534741",
      footerEnd: "#1A1A1A",
    },
  },
];

function readAppliedTheme() {
  const styles = window.getComputedStyle(document.documentElement);
  const values = BRAND_THEME_ROLES.reduce<Partial<ThemeValues>>((theme, role) => {
    theme[role.id] = styles.getPropertyValue(role.cssVar).trim();
    return theme;
  }, {});

  return normalizeBrandTheme(values);
}

export default function BrandThemeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ThemeRole>("buttonPrimary");
  const [theme, setTheme] = useState<ThemeValues>(DEFAULT_BRAND_THEME);
  const [globalTheme, setGlobalTheme] = useState<ThemeValues>(DEFAULT_BRAND_THEME);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedRoleConfig =
    BRAND_THEME_ROLES.find((role) => role.id === selectedRole) ?? BRAND_THEME_ROLES[0];

  const allColors = useMemo(() => {
    return Array.from(new Set(COLOR_GROUPS.flatMap((group) => group.colors.map((color) => color.toUpperCase()))));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let hasSavedDraft = false;
    const appliedTheme = readAppliedTheme();

    setTheme(appliedTheme);
    setGlobalTheme(appliedTheme);

    const saved = window.localStorage.getItem(BRAND_THEME_STORAGE_KEY);
    if (saved) {
      try {
        const nextTheme = normalizeBrandTheme(JSON.parse(saved));
        hasSavedDraft = true;
        setTheme(nextTheme);
        setHasLocalDraft(true);
        applyBrandTheme(nextTheme);
      } catch {
        window.localStorage.removeItem(BRAND_THEME_STORAGE_KEY);
      }
    }

    const loadGlobalTheme = async () => {
      try {
        const response = await fetch("/api/brand-theme", { cache: "no-store" });
        if (!response.ok) return;

        const payload = await response.json();
        const nextGlobalTheme = normalizeBrandTheme(payload?.data?.values);
        if (cancelled) return;

        setGlobalTheme(nextGlobalTheme);
        if (!hasSavedDraft) {
          setTheme(nextGlobalTheme);
          applyBrandTheme(nextGlobalTheme);
        }
      } catch {
        if (!cancelled) {
          setStatusMessage("Could not load the global theme. Local previews still work.");
        }
      }
    };

    void loadGlobalTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateTheme = (nextTheme: ThemeValues) => {
    const normalizedTheme = normalizeBrandTheme(nextTheme);

    setTheme(normalizedTheme);
    setHasLocalDraft(true);
    setStatusMessage("Local preview saved. Apply to publish globally.");
    applyBrandTheme(normalizedTheme);
    window.localStorage.setItem(BRAND_THEME_STORAGE_KEY, JSON.stringify(normalizedTheme));
  };

  const updateRole = (role: ThemeRole, color: string) => {
    updateTheme({ ...theme, [role]: color.toUpperCase() });
  };

  const resetTheme = () => {
    setTheme(globalTheme);
    setHasLocalDraft(false);
    setStatusMessage("Preview reset to the current global theme.");
    applyBrandTheme(globalTheme);
    window.localStorage.removeItem(BRAND_THEME_STORAGE_KEY);
  };

  const applyGlobalTheme = async () => {
    const values = normalizeBrandTheme(theme);

    setIsApplying(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/brand-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message ?? "Could not apply the global theme.");
      }

      const appliedTheme = normalizeBrandTheme(payload.data?.values ?? values);
      setTheme(appliedTheme);
      setGlobalTheme(appliedTheme);
      setHasLocalDraft(false);
      setStatusMessage("Applied globally.");
      applyBrandTheme(appliedTheme);
      window.localStorage.removeItem(BRAND_THEME_STORAGE_KEY);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not apply the global theme.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80]">
      {isOpen ? (
        <div className="w-[min(92vw,390px)] max-h-[min(76vh,720px)] overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Brand palette mixer</div>
              <div className="text-xs text-gray-500">Local preview until applied</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={applyGlobalTheme}
                disabled={isApplying}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-gray-950 px-2.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                title="Apply globally"
                aria-label="Apply theme globally"
              >
                {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Apply</span>
              </button>
              <button
                type="button"
                onClick={resetTheme}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                title="Reset preview to global theme"
                aria-label="Reset preview to global theme"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                title="Close palette mixer"
                aria-label="Close palette mixer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(min(76vh,720px)-57px)] overflow-y-auto p-4">
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="text-xs font-semibold text-gray-700">
                {hasLocalDraft ? "Previewing local theme" : "Using global theme"}
              </div>
              <div className="mt-1 text-xs leading-5 text-gray-500">
                {statusMessage ?? "Changes stay in this browser until Apply publishes them globally."}
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateTheme(preset.values)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <span className="mb-2 block">{preset.name}</span>
                  <span className="flex gap-1">
                    {Object.values(preset.values).slice(0, 5).map((color, colorIndex) => (
                      <span
                        key={`${preset.name}-${color}-${colorIndex}`}
                        className="h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                </button>
              ))}
            </div>

            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Element
            </label>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as ThemeRole)}
              className="mb-4 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-500"
            >
              {BRAND_THEME_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-600">{selectedRoleConfig.label}</span>
                <code className="rounded bg-white px-2 py-1 text-xs text-gray-700">{theme[selectedRole]}</code>
              </div>
              <div className="h-9 rounded-md border border-black/10" style={{ backgroundColor: theme[selectedRole] }} />
            </div>

            <div className="space-y-4">
              {COLOR_GROUPS.map((group) => (
                <section key={group.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.name}</h3>
                    <span className="text-[11px] text-gray-400">{group.colors.length}</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {group.colors.map((color) => {
                      const normalizedColor = color.toUpperCase();
                      const isSelected = theme[selectedRole] === normalizedColor;

                      return (
                        <button
                          key={`${group.name}-${normalizedColor}`}
                          type="button"
                          onClick={() => updateRole(selectedRole, normalizedColor)}
                          className={`h-8 rounded-md border transition ${
                            isSelected ? "border-gray-950 ring-2 ring-gray-950/20" : "border-black/10 hover:scale-105"
                          }`}
                          style={{ backgroundColor: normalizedColor }}
                          title={`${selectedRoleConfig.label}: ${normalizedColor}`}
                          aria-label={`Set ${selectedRoleConfig.label} to ${normalizedColor}`}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Hex input
              </label>
              <select
                value={theme[selectedRole]}
                onChange={(event) => updateRole(selectedRole, event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 font-mono text-xs text-gray-900 outline-none focus:border-gray-500"
              >
                {allColors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-gray-950 text-white shadow-xl transition hover:scale-105 hover:bg-gray-800"
          title="Open brand palette mixer"
          aria-label="Open brand palette mixer"
        >
          <Palette className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
