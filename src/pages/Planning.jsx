import { useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { Badge, ConfirmModal, Field, Modal, SearchBanner, btnDanger, btnGhost, btnPrimary, inputCls } from "../components/ui";
import { DEFAULT_MINUTES, MAX_GROUP_SIZE, TYPE_STYLE, phaseLabel, phaseShort } from "../constants";
import {
  addDays, addMinutes, errMsg, fmtDate, fmtTime, isFriday, startOfWeek, todayIso, weekDays,
} from "../utils";
import * as planningApi from "../api/planning";
import * as vehiclesApi from "../api/vehicles";
import * as usersApi from "../api/users";

const HOURS = Array.from({ length: 12 }, (_, i) => 7 + i); // 07..18

function NewSessionModal({ onClose, onCreate, students, vehicles, defaultDate }) {
  const [form, setForm] = useState({
    phase: "creneau", date: defaultDate, start_time: "09:00", group_label: "",
    vehicle_id: vehicles.find((v) => v.status === "disponible")?.id || "", student_ids: [],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const eligible = students.filter((s) => s.current_phase === form.phase && !s.course_completed);
  const availableVehicles = vehicles.filter((v) => v.status === "disponible");
  const end = addMinutes(form.start_time, DEFAULT_MINUTES[form.phase]);

  const toggleStudent = (id) => {
    setForm((f) => {
      if (f.phase === "code") {
        const has = f.student_ids.includes(id);
        if (!has && f.student_ids.length >= MAX_GROUP_SIZE) return f;
        return { ...f, student_ids: has ? f.student_ids.filter((x) => x !== id) : [...f.student_ids, id] };
      }
      return { ...f, student_ids: [id] };
    });
  };

  const canSubmit = form.phase === "code"
    ? form.student_ids.length > 0 && form.group_label.trim()
    : form.student_ids.length === 1 && form.vehicle_id;

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      await onCreate({
        phase: form.phase, date: form.date, start_time: form.start_time + ":00", end_time: end + ":00",
        vehicle_id: form.phase === "code" ? null : Number(form.vehicle_id),
        group_label: form.phase === "code" ? form.group_label.trim() : null,
        student_ids: form.student_ids,
      });
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Nouvelle Séance" onClose={onClose} wide>
      <Field label="Type de séance">
        <select className={inputCls + " border"} value={form.phase} onChange={(e) => set("phase", e.target.value)}>
          <option value="code">Code (groupe, 1h, sans véhicule)</option>
          <option value="creneau">Créneau (30 min, individuel)</option>
          <option value="circulation">Circulation (30 min, individuel)</option>
        </select>
      </Field>

      {form.phase === "code" ? (
        <Field label="Nom du groupe"><input className={inputCls + " border"} placeholder="Ex: Groupe C" value={form.group_label} onChange={(e) => set("group_label", e.target.value)} /></Field>
      ) : (
        <Field label="Véhicule" hint={availableVehicles.length === 0 ? "Aucun véhicule disponible (tous en maintenance)." : undefined}>
          <select className={inputCls + " border"} value={form.vehicle_id} onChange={(e) => set("vehicle_id", e.target.value)}>
            {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
          </select>
        </Field>
      )}

      <Field label={form.phase === "code" ? `Candidats du groupe (max ${MAX_GROUP_SIZE})` : "Candidat"}>
        <div className="max-h-40 overflow-y-auto space-y-1.5 border border-white/10 rounded-lg p-2">
          {eligible.length === 0 && <p className="text-xs text-slate-500 px-1">Aucun candidat dans cette phase.</p>}
          {eligible.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-slate-200 px-1.5 py-1 rounded hover:bg-white/5 cursor-pointer">
              <input type={form.phase === "code" ? "checkbox" : "radio"} name="student" checked={form.student_ids.includes(s.id)} onChange={() => toggleStudent(s.id)} className="accent-emerald-500" />
              {s.full_name}
            </label>
          ))}
        </div>
        {form.phase === "code" && <span className="block text-[11px] text-slate-500 mt-1">{form.student_ids.length} / {MAX_GROUP_SIZE} sélectionné(s)</span>}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" min={todayIso()} className={inputCls + " border"} value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Heure de début" hint={`Fin estimée : ${end}`}><input type="time" className={inputCls + " border"} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></Field>
      </div>
      {isFriday(form.date) && <p className="text-xs text-amber-300/80 mb-3">⚠️ C'est un vendredi (jour de repos habituel).</p>}

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <button className={btnPrimary + " w-full mt-1"} disabled={!canSubmit || busy} onClick={submit}>Ajouter la séance</button>
    </Modal>
  );
}

function EditSessionModal({ session, onClose, onSave, vehicles }) {
  const [form, setForm] = useState({ date: session.date, start_time: session.start_time.slice(0, 5), vehicle_id: session.vehicle_id || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const end = addMinutes(form.start_time, session.duration_hours * 60);
  const availableVehicles = vehicles.filter((v) => v.status === "disponible" || v.id === session.vehicle_id);

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      await onSave({
        date: form.date, start_time: form.start_time + ":00", end_time: end + ":00",
        vehicle_id: session.phase === "code" ? null : Number(form.vehicle_id) || null,
      });
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={"Modifier la séance — " + phaseLabel(session.phase)} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className={inputCls + " border"} value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
        <Field label="Heure de début" hint={`Fin estimée : ${end}`}><input type="time" className={inputCls + " border"} value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></Field>
      </div>
      {session.phase !== "code" && (
        <Field label="Véhicule">
          <select className={inputCls + " border"} value={form.vehicle_id} onChange={(e) => set("vehicle_id", e.target.value)}>
            {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
          </select>
        </Field>
      )}
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <button className={btnPrimary + " w-full"} disabled={busy} onClick={submit}>Enregistrer</button>
    </Modal>
  );
}

function CompleteModal({ session, onClose, onComplete }) {
  const [rows, setRows] = useState(session.attendances.map((a) => ({ student_id: a.student_id, name: a.student_name, attended: true, notes: "" })));
  const [busy, setBusy] = useState(false);
  const toggle = (id) => setRows((r) => r.map((x) => (x.student_id === id ? { ...x, attended: !x.attended } : x)));

  const submit = async () => {
    setBusy(true);
    try {
      await onComplete(rows.map(({ student_id, attended, notes }) => ({ student_id, attended, notes: notes || undefined })));
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Terminer la séance — présences" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3">Seuls les candidats présents reçoivent les heures de cette séance ({session.duration_hours} h).</p>
      <div className="space-y-2 mb-4">
        {rows.map((r) => (
          <label key={r.student_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 cursor-pointer">
            <input type="checkbox" className="accent-emerald-500" checked={r.attended} onChange={() => toggle(r.student_id)} />
            <span className="text-sm text-slate-200 flex-1">{r.name}</span>
            <Badge tone={r.attended ? "emerald" : "slate"}>{r.attended ? "Présent" : "Absent"}</Badge>
          </label>
        ))}
      </div>
      <button className={btnPrimary + " w-full"} disabled={busy} onClick={submit}>Valider la séance</button>
    </Modal>
  );
}

function SessionCard({ s, onEdit, onComplete, onReopen, onCancel, onDelete }) {
  const st = TYPE_STYLE[s.phase];
  const label = s.group_label || s.attendances.map((a) => a.student_name).join(", ") || "—";
  const canAct = s.status === "scheduled";
  return (
    <div className={"rounded-lg border px-2.5 py-2 text-[11px] leading-tight mb-1.5 " + st.bg + " " + st.border + " " + st.text + (s.status === "canceled" ? " opacity-40 line-through" : "")}>
      <div className="font-semibold truncate">{label}</div>
      <div className="opacity-80 flex items-center gap-1">{phaseShort(s.phase)} · {fmtTime(s.start_time)}{s.vehicle_label ? " · " + s.vehicle_label.split(" — ")[1] : ""}{s.status === "completed" ? " ✓" : ""}</div>
      {canAct && (
        <div className="flex gap-1.5 mt-1.5">
          <button onClick={() => onComplete(s)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">Terminer</button>
          <button onClick={() => onEdit(s)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">Modifier</button>
          <button onClick={() => onCancel(s)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">Annuler</button>
        </div>
      )}
      {s.status === "completed" && (
        <button onClick={() => onReopen(s)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 mt-1.5">Rouvrir</button>
      )}
      {s.status === "canceled" && (
        <button onClick={() => onDelete(s)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 mt-1.5">Supprimer</button>
      )}
    </div>
  );
}

export default function Planning({ notify, search, onClearSearch }) {
  const [sessions, setSessions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [students, setStudents] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(todayIso()));
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [confirming, setConfirming] = useState(null); // {type: "cancel"|"delete"|"reopen", session}
  const [loading, setLoading] = useState(true);
  const week = weekDays(weekStart);

  const reload = () => Promise.all([
    planningApi.listSessions({ date_from: addDays(weekStart, -3), date_to: addDays(weekStart, 9) }),
    vehiclesApi.listVehicles(),
    usersApi.listStudents(),
  ]).then(([s, v, st]) => { setSessions(s); setVehicles(v); setStudents(st); });

  useEffect(() => { reload().catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false)); }, [weekStart]);

  const visible = search.trim()
    ? sessions.filter((s) => (s.group_label || "").toLowerCase().includes(search.toLowerCase()) ||
        s.attendances.some((a) => a.student_name.toLowerCase().includes(search.toLowerCase())))
    : sessions;

  const cellSessions = (iso, hour) => visible.filter((s) => s.date === iso && parseInt(s.start_time.slice(0, 2), 10) === hour);
  const todays = visible.filter((s) => s.date === todayIso() && s.status !== "canceled").sort((a, b) => a.start_time.localeCompare(b.start_time));

  const create = async (payload) => {
    await planningApi.createSession(payload);
    notify("Séance ajoutée au planning");
    reload();
  };
  const saveEdit = async (payload) => {
    await planningApi.updateSession(editing.id, payload);
    notify("Séance modifiée");
    reload();
  };
  const complete = async (session, attendances) => {
    try {
      await planningApi.completeSession(session.id, attendances);
      notify("Séance terminée, heures créditées");
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };
  const doConfirm = async () => {
    const { type, session } = confirming;
    try {
      if (type === "cancel") { await planningApi.cancelSession(session.id); notify("Séance annulée"); }
      if (type === "delete") { await planningApi.deleteSession(session.id); notify("Séance supprimée"); }
      if (type === "reopen") { await planningApi.reopenSession(session.id); notify("Séance rouverte, heures retirées"); }
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };

  if (loading) return <p className="text-slate-500 text-sm">Chargement...</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Planning &amp; Séances</h1>
          <p className="text-slate-400 text-sm mt-1">Semaine du {fmtDate(week[0].iso)} au {fmtDate(week[5].iso)}</p>
          <SearchBanner search={search} onClear={onClearSearch} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -6))} className={btnGhost}><Icon name="chevron-left" size={15} /></button>
          <button onClick={() => setWeekStart(startOfWeek(todayIso()))} className={btnGhost}>Aujourd'hui</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 6))} className={btnGhost}><Icon name="chevron" size={15} /></button>
          <button onClick={() => setShowNew(true)} className={btnPrimary}><Icon name="plus" size={16} /> Nouvelle Séance</button>
        </div>
      </div>

      <div className="card p-4 overflow-x-auto">
        <div className="min-w-[840px]">
          <div className="grid gap-px bg-white/5 rounded-xl overflow-hidden" style={{ gridTemplateColumns: "70px repeat(6, 1fr)" }}>
            <div className="bg-[#0B1424] p-2" />
            {week.map((d) => (
              <div key={d.iso} className={"p-2.5 text-center text-sm font-semibold " + (d.iso === todayIso() ? "bg-emerald-500/10 text-emerald-300" : "bg-[#0B1424] text-slate-300")}>
                {d.label}<br /><span className="text-[10px] opacity-70">{String(d.num).padStart(2, "0")}</span>
              </div>
            ))}
            {HOURS.map((h) => (
              <div key={h} style={{ display: "contents" }}>
                <div className="bg-[#0B1424] p-2 text-xs text-slate-500 text-right pr-3">{String(h).padStart(2, "0")}:00</div>
                {week.map((d) => (
                  <div key={d.iso + h} className="bg-[#0A1220] p-1.5 min-h-[58px]">
                    {cellSessions(d.iso, h).map((s) => (
                      <SessionCard key={s.id} s={s} onEdit={setEditing} onComplete={setCompleting}
                        onReopen={(s) => setConfirming({ type: "reopen", session: s })}
                        onCancel={(s) => setConfirming({ type: "cancel", session: s })}
                        onDelete={(s) => setConfirming({ type: "delete", session: s })} />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-white mb-4">To-Do — Séances d'aujourd'hui</h2>
        <div className="space-y-2">
          {todays.length === 0 && <p className="text-sm text-slate-500">Aucune séance aujourd'hui.</p>}
          {todays.map((s) => {
            const st = TYPE_STYLE[s.phase];
            const label = s.group_label || s.attendances.map((a) => a.student_name).join(", ");
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex-wrap">
                <span className={"w-2 h-2 rounded-full " + st.dot} />
                <div className="w-14 text-sm text-slate-300">{fmtTime(s.start_time)}</div>
                <div className="flex-1 text-sm text-slate-200 min-w-[140px]">{label} <span className="text-slate-500">— {phaseShort(s.phase)}</span></div>
                {s.status === "completed" ? (
                  <Badge tone="emerald">Terminé</Badge>
                ) : (
                  <div className="flex gap-1.5">
                    <button onClick={() => setCompleting(s)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"><Icon name="check" size={13} /> Terminer</button>
                    <button onClick={() => setConfirming({ type: "cancel", session: s })} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/5">Annuler</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showNew && <NewSessionModal onClose={() => setShowNew(false)} onCreate={create} students={students} vehicles={vehicles} defaultDate={todayIso()} />}
      {editing && <EditSessionModal session={editing} vehicles={vehicles} onClose={() => setEditing(null)} onSave={saveEdit} />}
      {completing && <CompleteModal session={completing} onClose={() => setCompleting(null)} onComplete={(a) => complete(completing, a)} />}
      {confirming?.type === "cancel" && (
        <ConfirmModal title="Annuler la séance ?" message="Les candidats concernés seront prévenus. Cette action n'est pas réversible." confirmLabel="Annuler la séance" danger onConfirm={doConfirm} onClose={() => setConfirming(null)} />
      )}
      {confirming?.type === "delete" && (
        <ConfirmModal title="Supprimer la séance ?" message="Cette séance sera définitivement supprimée." confirmLabel="Supprimer" danger onConfirm={doConfirm} onClose={() => setConfirming(null)} />
      )}
      {confirming?.type === "reopen" && (
        <ConfirmModal title="Rouvrir la séance ?" message="Les heures déjà créditées aux candidats présents seront retirées. Vous pourrez ensuite la terminer à nouveau." confirmLabel="Rouvrir" onConfirm={doConfirm} onClose={() => setConfirming(null)} />
      )}
    </div>
  );
}