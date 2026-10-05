// ---------- Erreurs API lisibles ----------
export function errMsg(err, fallback = "Une erreur est survenue.") {
  if (err?.code === "ERR_NETWORK") return "Impossible de joindre le serveur. Vérifiez que le backend est lancé.";
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d.length) {
    const msg = d[0]?.msg || "";
    return msg.replace(/^Value error,\s*/i, "") || fallback;
  }
  return fallback;
}

// ---------- Dates (heure locale, jamais toISOString qui décale en UTC) ----------
const pad = (n) => String(n).padStart(2, "0");
export const toLocalIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = () => toLocalIso(new Date());
export const parseIso = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (iso, n) => {
  const d = parseIso(iso);
  d.setDate(d.getDate() + n);
  return toLocalIso(d);
};

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// La semaine de l'auto-école commence le samedi et se termine le jeudi (vendredi = repos)
export function startOfWeek(iso) {
  const d = parseIso(iso);
  const back = (d.getDay() + 1) % 7; // sam=0, dim=1 ... ven=6
  d.setDate(d.getDate() - back);
  return toLocalIso(d);
}
export function weekDays(startIso) {
  return Array.from({ length: 6 }, (_, i) => {
    const iso = addDays(startIso, i);
    return { iso, label: DAY_LABELS[parseIso(iso).getDay()], num: parseIso(iso).getDate() };
  });
}
export const isFriday = (iso) => parseIso(iso).getDay() === 5;

export const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
export const fmtDateLong = (iso) => {
  const d = parseIso(iso);
  return `${DAY_LABELS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const fmtTime = (t) => (t ? t.slice(0, 5) : "");
export const addMinutes = (hhmm, minutes) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
};

export const fmtDA = (n) => Number(n || 0).toLocaleString("fr-FR") + " DA";
export const fmtH = (h) => `${Number(h || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} h`;

export function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(isoString).toLocaleDateString("fr-FR");
}

// 0550123456 -> 213550123456 (format wa.me)
export const waNumber = (phone) => {
  const p = (phone || "").replace(/\D/g, "");
  return p.startsWith("0") ? "213" + p.slice(1) : p;
};
