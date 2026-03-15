export const colorPalette = [
  { name: "Canvas", value: "#F7F4EE", usage: "Page background and large surfaces" },
  { name: "Panel", value: "#FFFDF8", usage: "Cards, sheets, and elevated panels" },
  { name: "Surface", value: "rgba(255,255,255,0.72)", usage: "Glass layers and sticky chrome" },
  { name: "Foreground", value: "#191816", usage: "Primary text and strong contrast" },
  { name: "Muted", value: "#6F6B64", usage: "Supporting labels and secondary text" },
  { name: "Brand", value: "#2F6A53", usage: "Primary actions and focus accents" },
  { name: "Brand Soft", value: "#DBE8DF", usage: "Selection, pills, and subtle fills" },
];

export const typographyScale = [
  { token: "Display 2XL", value: "clamp(4rem, 10vw, 7rem)", usage: "Hero headlines" },
  { token: "Display XL", value: "clamp(3rem, 7vw, 5.25rem)", usage: "Section headlines" },
  { token: "Display LG", value: "clamp(2.25rem, 5vw, 3.75rem)", usage: "Page titles" },
  { token: "Title LG", value: "1.5rem", usage: "Card titles" },
  { token: "Body LG", value: "1.0625rem", usage: "Primary reading text" },
  { token: "Body MD", value: "0.9375rem", usage: "Form fields and metadata" },
  { token: "Caption", value: "0.75rem", usage: "Overlines and helper text" },
];

export const spacingSystem = [
  "4px",
  "8px",
  "12px",
  "16px",
  "20px",
  "24px",
  "32px",
  "40px",
  "48px",
  "64px",
  "80px",
];

export const borderRadius = [
  { token: "SM", value: "16px" },
  { token: "MD", value: "24px" },
  { token: "LG", value: "32px" },
  { token: "Pill", value: "999px" },
];

export const shadowStyles = [
  { name: "Soft", value: "0 12px 40px rgba(17, 24, 39, 0.08)" },
  { name: "Card", value: "0 16px 48px rgba(17, 24, 39, 0.10)" },
  { name: "Modal", value: "0 24px 80px rgba(17, 24, 39, 0.16)" },
];

export const glassBlurEffects = [
  { name: "Background", value: "Linear white gradient with transparency" },
  { name: "Border", value: "1px rgba(255,255,255,0.72)" },
  { name: "Blur", value: "20px backdrop blur" },
];
