import { useEffect } from "react";
import { Icon } from "./icons";

export const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";
export const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:pointer-events-none";
export const btnGhost = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-200 text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:pointer-events-none";
export const btnDanger = "inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-400/30 text-red-300 hover:bg-red-500/10 text-sm px-4 py-2.5 transition-colors disabled:opacity-40 disabled:pointer-events-none";

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-white/5 text-slate-300 border-white/10",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
    red: "bg-red-500/15 text-red-300 border-red-400/30",
  };
  return <span className={"inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border whitespace-nowrap " + tones[tone]}>{children}</span>;
}

export function ProgressBar({ value, tone = "emerald" }) {
  const colors = { emerald: "bg-emerald-500", amber: "bg-amber-500", indigo: "bg-indigo-500" };
  return (
    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
      <div className={"h-full rounded-full transition-all " + colors[tone]} style={{ width: Math.min(100, Math.max(0, value)) + "%" }} />
    </div>
  );
}

// toast = { msg, type: "success" | "error" }
export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.type === "error" ? 5000 : 2800);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const error = toast.type === "error";
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] fade-in max-w-[92vw]">
      <div className={"card px-4 py-3 flex items-center gap-2 shadow-2xl " + (error ? "border-red-400/40" : "border-emerald-400/30")}>
        <span className={"w-6 h-6 rounded-full flex items-center justify-center shrink-0 " + (error ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300")}>
          <Icon name={error ? "alert" : "check"} size={14} />
        </span>
        <span className="text-sm text-slate-200">{toast.msg}</span>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onMouseDown={onClose}>
      <div className={"card w-full " + (wide ? "max-w-xl" : "max-w-md") + " p-5 sm:p-6 max-h-[90vh] overflow-y-auto"} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 shrink-0"><Icon name="x" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel = "Confirmer", danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-300 mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className={btnGhost}>Annuler</button>
        <button onClick={() => { onConfirm(); onClose(); }} className={danger ? btnDanger : btnPrimary}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-xs text-slate-400 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

export function Loading({ text = "Chargement..." }) {
  return <p className="text-slate-500 text-sm py-6">{text}</p>;
}

export function SearchBanner({ search, onClear }) {
  if (!search?.trim()) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Icon name="search" size={13} /> Filtre actif : « {search} »
      <button onClick={onClear} className="text-emerald-400 hover:underline">effacer</button>
    </div>
  );
}
