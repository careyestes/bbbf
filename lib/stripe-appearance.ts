import type { Appearance } from "@stripe/stripe-js";

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function getStripeAppearance(): Appearance {
  const dark =
    document.documentElement.getAttribute("data-theme") === "dark" ||
    (document.documentElement.getAttribute("data-theme") !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const ink = cssVar("--color-ink");
  const muted = cssVar("--color-muted");
  const surface = cssVar("--color-surface");
  const bg = cssVar("--color-bg");
  const honey = cssVar("--color-honey");
  const honeyDeep = cssVar("--color-honey-deep");
  const honeySoft = cssVar("--color-honey-soft");
  const borderStrong = cssVar("--color-border-strong");
  const border = cssVar("--color-border");
  const error = cssVar("--color-error");
  const placeholder = cssVar("--color-placeholder");

  return {
    theme: dark ? "night" : "stripe",
    variables: {
      colorPrimary: honeyDeep,
      colorBackground: surface,
      colorText: ink,
      colorTextSecondary: muted,
      colorTextPlaceholder: placeholder,
      colorDanger: error,
      colorIcon: muted,
      colorIconHover: ink,
      fontFamily: "Figtree, system-ui, sans-serif",
      fontSizeBase: "16px",
      borderRadius: "14px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: `2px solid ${borderStrong}`,
        backgroundColor: bg,
        boxShadow: "none",
        color: ink,
      },
      ".Input:focus": {
        border: `2px solid ${ink}`,
        boxShadow: `0 0 0 3px ${honey}`,
      },
      ".Tab, .AccordionItem": {
        border: `1px solid ${border}`,
        backgroundColor: surface,
        boxShadow: "none",
        color: ink,
      },
      ".Tab:hover, .AccordionItem:hover": {
        backgroundColor: honeySoft,
      },
      ".Tab--selected, .AccordionItem--selected": {
        borderColor: honeyDeep,
        backgroundColor: dark ? "rgba(255, 204, 0, 0.16)" : "rgba(255, 204, 0, 0.12)",
        color: ink,
      },
      ".Block": {
        backgroundColor: surface,
        borderColor: border,
        boxShadow: "none",
      },
      ".Label": {
        color: muted,
      },
    },
  };
}
