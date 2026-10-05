import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { Badge, Modal, inputCls } from "./ui";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { useAuth } from "../context/AuthContext";
import * as usersApi from "../api/users";
import { phaseShort } from "../constants";
import { errMsg } from "../utils";

const NAV = [
  { key: "dashboard", label: "Tableau de bord", icon: "home" },
  { key: "planning", label: "Planning & Séances", icon: "calendar" },
  { key: "pipeline", label: "Pipeline Candidats", icon: "pipeline" },
  { key: "exams", label: "Examens", icon: "file" },
  { key: "settings", label: "Paramètres", icon: "settings" },
];

function ImpersonateModal({ onClose, notify }) {
  const { startImpersonate } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.listInstructors().then(setInstructors).catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false));
  }, []);

  return (
    <Modal title="Basculer vers un compte moniteur" onClose={onClose}>
      {loading && <p className="text-sm text-slate-500">Chargement...</p>}
      {!loading && instructors.length === 0 && <p className="text-sm text-slate-500">Aucun moniteur. Créez-en un dans Paramètres → Équipe.</p>}
      <div className="space-y-2">
        {instructors.map((i) => (
          <button key={i.id} onClick={async () => {
            try { await startImpersonate(i.id); notify("Connecté en tant que " + i.full_name); onClose(); }
            catch (e) { notify(errMsg(e), "error"); }
          }} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-white/10 hover:border-indigo-400/40 hover:bg-indigo-500/5 text-sm text-slate-200">
            {i.full_name} <Icon name="chevron" size={14} />
          </button>
        ))}
      </div>
    </Modal>
  );
}

// Recherche globale : suggestions de candidats, utilisable depuis n'importe quelle page
function GlobalSearch({ search, onSearchChange, setScreen }) {
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      usersApi.listStudents({ q: search.trim(), limit: 6 }).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (name) => { onSearchChange(name); setScreen("pipeline"); setOpen(false); };

  return (
    <div className="relative flex-1 max-w-sm hidden sm:block" ref={ref}>
      <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        className={inputCls + " border pl-9 pr-8"}
        placeholder="Rechercher un candidat..."
        value={search}
        onFocus={() => setOpen(true)}
        onChange={(e) => { onSearchChange(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) { setScreen("pipeline"); setOpen(false); } }}
      />
      {search && (
        <button onClick={() => onSearchChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><Icon name="x" size={13} /></button>
      )}
      {open && search.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 card z-50 overflow-hidden fade-in">
          {results.length === 0 && <p className="text-xs text-slate-500 p-3">Aucun candidat trouvé.</p>}
          {results.map((s) => (
            <button key={s.id} onClick={() => pick(s.full_name)} className="w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0">
              <span>
                <span className="block text-sm text-slate-200">{s.full_name}</span>
                <span className="block text-xs text-slate-500">{s.phone}</span>
              </span>
              <Badge tone={s.course_completed ? "emerald" : "slate"}>{s.course_completed ? "Terminé" : phaseShort(s.current_phase)}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Shell({ screen, setScreen, notify, search, onSearchChange, children }) {
  const { user, impersonating, logout, stopImpersonate } = useAuth();
  const [showImpersonate, setShowImpersonate] = useState(false);

  const onNotifKind = (kind) => {
    if (kind.startsWith("exam")) setScreen("exams");
    else if (kind.startsWith("session")) setScreen("planning");
    else if (kind === "payment" || kind === "phase_changed") setScreen("pipeline");
  };

  return (
    <div className="min-h-screen flex bg-hero">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-white/5 bg-[#070D18]/80 p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-display font-extrabold flex items-center justify-center text-sm">DZ</div>
          <span className="font-display font-bold text-white text-sm leading-tight">DriveDZ</span>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setScreen(n.key)}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors " + (screen === n.key ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
              <Icon name={n.icon} size={17} /> {n.label}
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t border-white/5 space-y-2">
          {user.role === "admin" && !impersonating && (
            <button onClick={() => setShowImpersonate(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-indigo-300 hover:bg-indigo-500/10 border border-indigo-400/20">
              <Icon name="swap" size={16} /> Basculer vers un moniteur
            </button>
          )}
          {impersonating && (
            <button onClick={async () => { try { await stopImpersonate(); notify("Retour au compte Admin"); } catch (e) { notify(errMsg(e), "error"); } }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-indigo-300 hover:bg-indigo-500/10 border border-indigo-400/20">
              <Icon name="swap" size={16} /> Revenir à mon compte Admin
            </button>
          )}
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5">
            <Icon name="logout" size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 sm:px-7 py-4 border-b border-white/5 sticky top-0 bg-[#060B14]/90 backdrop-blur z-30">
          <GlobalSearch search={search} onSearchChange={onSearchChange} setScreen={setScreen} />
          <div className="md:hidden flex items-center gap-1 flex-1 overflow-x-auto">
            {NAV.map((n) => (
              <button key={n.key} onClick={() => setScreen(n.key)} className={"px-3 py-1.5 rounded-lg text-xs whitespace-nowrap " + (screen === n.key ? "bg-emerald-500 text-slate-950 font-semibold" : "text-slate-400 bg-white/5")}>{n.label}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {impersonating && <Badge tone="indigo">connecté en tant que Admin</Badge>}
            <NotificationBell onOpenKind={onNotifKind} />
            <ProfileMenu notify={notify} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-7 fade-in">{children}</main>
      </div>

      {showImpersonate && <ImpersonateModal onClose={() => setShowImpersonate(false)} notify={notify} />}
    </div>
  );
}
