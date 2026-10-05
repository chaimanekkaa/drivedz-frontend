export const PHASES = [
  { key: "code", label: "Code de la Route", short: "Code" },
  { key: "creneau", label: "Créneau (Manœuvres)", short: "Créneau" },
  { key: "circulation", label: "Circulation (Route)", short: "Circulation" },
];
export const phaseLabel = (key) => PHASES.find((p) => p.key === key)?.label || key;
export const phaseShort = (key) => PHASES.find((p) => p.key === key)?.short || key;

// Durées standard proposées à la création d'une séance (minutes)
export const DEFAULT_MINUTES = { code: 60, creneau: 30, circulation: 30 };
export const MAX_GROUP_SIZE = 15;

export const TYPE_STYLE = {
  code: { bg: "bg-indigo-500/15", text: "text-indigo-200", border: "border-indigo-400/30", dot: "bg-indigo-400", tone: "indigo" },
  creneau: { bg: "bg-amber-500/15", text: "text-amber-200", border: "border-amber-400/30", dot: "bg-amber-400", tone: "amber" },
  circulation: { bg: "bg-emerald-500/15", text: "text-emerald-200", border: "border-emerald-400/30", dot: "bg-emerald-400", tone: "emerald" },
};
