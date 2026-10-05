import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { timeAgo } from "../utils";
import * as notifApi from "../api/notifications";

const KIND_ICON = {
  exam_request: "file", exam_accepted: "check", exam_refused: "x", exam_passed: "check", exam_failed: "alert",
  exam_announced: "calendar", session_created: "calendar", session_updated: "clock", session_canceled: "x",
  payment: "wallet", phase_changed: "pipeline",
};

export default function NotificationBell({ onOpenKind }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread_count: 0 });
  const ref = useRef(null);

  const load = useCallback(() => notifApi.listNotifications().then(setData).catch(() => {}), []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = () => { setOpen((v) => !v); if (!open) load(); };
  const clickItem = async (n) => {
    if (!n.is_read) { await notifApi.markRead(n.id).catch(() => {}); load(); }
    if (onOpenKind) onOpenKind(n.kind);
    setOpen(false);
  };
  const readAll = async () => { await notifApi.markAllRead().catch(() => {}); load(); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative w-9 h-9 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400" aria-label="Notifications">
        <Icon name="bell" size={17} />
        {data.unread_count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
            {data.unread_count > 9 ? "9+" : data.unread_count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[90vw] card z-50 fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-slate-200">Notifications</span>
            {data.unread_count > 0 && <button onClick={readAll} className="text-xs text-emerald-400 hover:underline">Tout marquer comme lu</button>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {data.items.length === 0 && <p className="text-xs text-slate-500 p-4">Aucune notification pour le moment.</p>}
            {data.items.map((n) => (
              <button key={n.id} onClick={() => clickItem(n)} className={"w-full text-left flex gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/[0.03] " + (n.is_read ? "opacity-60" : "")}>
                <span className="mt-0.5 w-7 h-7 rounded-full bg-white/5 text-emerald-300 flex items-center justify-center shrink-0"><Icon name={KIND_ICON[n.kind] || "bell"} size={14} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-slate-100 font-medium truncate">{n.title}</span>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">{n.message}</span>
                  <span className="block text-[11px] text-slate-600 mt-1">{timeAgo(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
