import { useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { Badge, Field, Modal, ProgressBar, btnPrimary, inputCls } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { PHASES, phaseShort, TYPE_STYLE } from "../constants";
import { errMsg, fmtTime, todayIso } from "../utils";
import * as usersApi from "../api/users";
import * as planningApi from "../api/planning";
import * as vehiclesApi from "../api/vehicles";

function NewCandidateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSubmit = form.full_name.trim().length >= 3 && form.phone.trim() && form.password.length >= 6;
  return (
    <Modal title="Nouveau Candidat" onClose={onClose}>
      <Field label="Nom complet"><input className={inputCls + " border"} placeholder="Ex: Yacine Boudiaf" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
      <Field label="Téléphone"><input className={inputCls + " border"} placeholder="0550 12 34 56" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
      <Field label="Mot de passe provisoire (min. 6 caractères)" hint="Le candidat pourra le changer depuis son profil.">
        <input type="password" className={inputCls + " border"} value={form.password} onChange={(e) => set("password", e.target.value)} />
      </Field>
      <button disabled={!canSubmit || busy} className={btnPrimary + " w-full mt-1"} onClick={async () => { setBusy(true); await onCreate(form); setBusy(false); }}>
        Créer le candidat
      </button>
    </Modal>
  );
}

export default function Dashboard({ setScreen, notify }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCandidate, setShowNewCandidate] = useState(false);

  const reload = () => Promise.all([
    usersApi.listStudents(),
    planningApi.listSessions({ date_from: todayIso() }),
    vehiclesApi.listVehicles(),
  ]).then(([s, se, v]) => { setStudents(s); setSessions(se); setVehicles(v); });

  useEffect(() => { reload().catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false)); }, []);

  const createCandidate = async (form) => {
    try {
      await usersApi.createUser({ ...form, role: "student", gender: user.gender });
      notify("Candidat créé avec succès");
      setShowNewCandidate(false);
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };

  const today = sessions.filter((s) => s.date === todayIso() && s.status !== "canceled").sort((a, b) => a.start_time.localeCompare(b.start_time));
  const activeStudents = students.filter((s) => !s.course_completed);
  const avgProgress = activeStudents.length
    ? Math.round(activeStudents.reduce((sum, s) => sum + Math.min(100, (s.hours_current / s.hours_required) * 100), 0) / activeStudents.length)
    : 0;
  const readyCount = activeStudents.filter((s) => s.ready_for_exam).length;

  const stats = [
    { label: "Candidats actifs", value: activeStudents.length, icon: "user" },
    { label: "Séances aujourd'hui", value: today.length, icon: "calendar" },
    { label: "Prêts pour l'examen", value: readyCount, icon: "check" },
    { label: "Véhicules disponibles", value: vehicles.filter((v) => v.status === "disponible").length + "/" + vehicles.length, icon: "car" },
  ];

  if (loading) return <p className="text-slate-500 text-sm">Chargement...</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Bonjour, {user.full_name.split(" ")[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Voici un aperçu de votre auto-école aujourd'hui.</p>
        </div>
        <button onClick={() => setShowNewCandidate(true)} className={btnPrimary}><Icon name="plus" size={16} /> Nouveau Membre</button>
      </div>
      {showNewCandidate && <NewCandidateModal onClose={() => setShowNewCandidate(false)} onCreate={createCandidate} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-4">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-emerald-300 mb-3"><Icon name={s.icon} size={17} /></div>
            <div className="font-display text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-white">Mes séances aujourd'hui</h2>
            <button onClick={() => setScreen("planning")} className="text-xs text-emerald-400 hover:underline">Voir tout →</button>
          </div>
          <div className="space-y-2.5">
            {today.length === 0 && <p className="text-sm text-slate-500">Aucune séance prévue aujourd'hui.</p>}
            {today.map((s) => {
              const st = TYPE_STYLE[s.phase];
              const names = s.group_label || s.attendances.map((a) => a.student_name).join(", ");
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-14 text-sm text-slate-300 font-medium">{fmtTime(s.start_time)}</div>
                  <span className={"w-2 h-2 rounded-full " + st.dot} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{names}</div>
                    <div className="text-xs text-slate-500">{phaseShort(s.phase)}{s.vehicle_label ? " · " + s.vehicle_label : ""}</div>
                  </div>
                  {s.status === "completed" ? <Badge tone="emerald">Terminé</Badge> : <Badge tone="slate">À venir</Badge>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold text-white mb-4">Pipeline — répartition</h2>
          <div className="space-y-4">
            {PHASES.map((p) => {
              const n = activeStudents.filter((s) => s.current_phase === p.key).length;
              return (
                <div key={p.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{p.label}</span>
                    <span className="text-slate-400">{n}</span>
                  </div>
                  <ProgressBar value={activeStudents.length ? (n / activeStudents.length) * 100 : 0} tone={TYPE_STYLE[p.key].tone} />
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500">Progression moyenne : {avgProgress}%</span>
            <button onClick={() => setScreen("pipeline")} className="text-xs text-emerald-400 hover:underline">Ouvrir le pipeline →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
