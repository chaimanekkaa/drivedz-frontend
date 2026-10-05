import { useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { Badge, Field, Modal, ProgressBar, SearchBanner, btnPrimary, inputCls } from "../components/ui";
import { PHASES, TYPE_STYLE, phaseLabel } from "../constants";
import { errMsg, fmtDA, fmtH, todayIso } from "../utils";
import * as usersApi from "../api/users";
import * as paymentsApi from "../api/payments";

function PaymentModal({ student, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(""); setBusy(true);
    try {
      await onSave(Number(amount), date);
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={"Enregistrer un paiement — " + student.full_name} onClose={onClose}>
      <Field label="Montant (DA)" hint={`Reste à payer : ${fmtDA(student.remaining)}`}>
        <input type="number" min="1" max={student.remaining} className={inputCls + " border"} placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Date"><input type="date" max={todayIso()} className={inputCls + " border"} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <button disabled={!amount || busy} className={btnPrimary + " w-full"} onClick={submit}>Enregistrer le paiement</button>
    </Modal>
  );
}

function StudentCard({ s, notify, onValidate, onPay, onSetPhase }) {
  const pct = Math.round((s.hours_current / s.hours_required) * 100);
  const [showPay, setShowPay] = useState(false);
  const nextLabel = s.current_phase === "code" ? "Créneau" : s.current_phase === "circulation" ? "formation terminée" : "Circulation";

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-100">{s.full_name}</div>
          <div className="text-xs text-slate-500 mt-0.5">Moniteur : {s.instructor_name || "—"}</div>
        </div>
        {s.ready_for_exam ? <Badge tone="emerald">Prêt Examen</Badge> : <Badge tone="amber">En cours</Badge>}
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Progression</span><span>{fmtH(s.hours_current)} / {fmtH(s.hours_required)}</span></div>
        <ProgressBar value={pct} tone={TYPE_STYLE[s.current_phase].tone} />
        {s.extra_hours > 0 && <div className="text-[11px] text-amber-300/80 mt-1">+{fmtH(s.extra_hours)} supplémentaire(s)</div>}
      </div>
      <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
        <Icon name="wallet" size={13} /> Payé : <span className="text-slate-200">{fmtDA(s.total_paid)}</span> — Reste : <span className={s.remaining > 0 ? "text-amber-300" : "text-emerald-300"}>{fmtDA(s.remaining)}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => setShowPay(true)} disabled={s.remaining === 0} className="flex-1 text-xs px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-40">
          {s.remaining === 0 ? "Soldé" : "Enregistrer paiement"}
        </button>
        <button disabled={!s.ready_for_exam} onClick={() => onValidate(s)} className={"flex-1 text-xs px-3 py-2 rounded-lg font-medium " + (s.ready_for_exam ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-white/5 text-slate-600 cursor-not-allowed")}>
          Valider → {nextLabel}
        </button>
      </div>
      <label className="block pt-1">
        <span className="block text-[11px] text-slate-500 mb-1">Changer la phase manuellement (candidat déjà avancé ailleurs)</span>
        <select className="w-full rounded-lg px-2.5 py-2 text-xs text-slate-300 bg-white/[0.03] border border-white/10"
          value={s.current_phase} onChange={(e) => e.target.value !== s.current_phase && onSetPhase(s, e.target.value)}>
          {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </label>
      {showPay && <PaymentModal student={s} onClose={() => setShowPay(false)} onSave={(amt, date) => onPay(s, amt, date)} />}
    </div>
  );
}

export default function Pipeline({ notify, search = "", onClearSearch }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => usersApi.listStudents().then(setStudents);
  useEffect(() => { reload().catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false)); }, []);

  const validate = async (s) => {
    try {
      const res = await usersApi.validatePhase(s.id);
      notify(res.course_completed ? s.full_name + " a terminé sa formation 🎉" : s.full_name + " validé(e) → " + phaseLabel(res.current_phase));
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };
  const pay = async (s, amount, date) => {
    const res = await paymentsApi.createPayment({ student_id: s.id, amount, paid_at: date });
    notify("Paiement de " + fmtDA(amount) + " enregistré (reçu " + res.receipt_number + ")");
    reload();
  };
  const setPhase = async (s, phase) => {
    try {
      await usersApi.setPhase(s.id, phase);
      notify("Phase de " + s.full_name + " changée manuellement → " + phaseLabel(phase));
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };

  const active = students.filter((s) => !s.course_completed);
  const completed = students.filter((s) => s.course_completed);
  const visible = search.trim()
    ? active.filter((s) => s.full_name.toLowerCase().includes(search.trim().toLowerCase()) || s.phone.includes(search.trim()))
    : active;

  if (loading) return <p className="text-slate-500 text-sm">Chargement...</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Pipeline Candidats</h1>
        <p className="text-slate-400 text-sm mt-1">{active.length} candidat(s) en formation{completed.length ? ` · ${completed.length} formation(s) terminée(s)` : ""}</p>
        <SearchBanner search={search} onClear={onClearSearch} />
      </div>

      {search.trim() && <p className="text-xs text-slate-500">{visible.length} résultat(s) pour « {search} »</p>}

      <div className="grid md:grid-cols-3 gap-5">
        {PHASES.map((p, idx) => {
          const list = visible.filter((s) => s.current_phase === p.key);
          return (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-display font-bold text-white text-sm">{idx + 1}. {p.label}</h2>
                <Badge tone="slate">{list.length}</Badge>
              </div>
              <div className="space-y-3">
                {list.length === 0 && <p className="text-xs text-slate-600 px-1">Aucun candidat{search.trim() ? " trouvé" : ""}.</p>}
                {list.map((s) => (
                  <StudentCard key={s.id} s={s} notify={notify} onValidate={validate} onPay={pay} onSetPhase={setPhase} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {completed.length > 0 && !search.trim() && (
        <div className="pt-2">
          <h2 className="font-display font-bold text-white text-sm mb-3">Formations terminées</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completed.map((s) => (
              <div key={s.id} className="card p-3 flex items-center justify-between">
                <span className="text-sm text-slate-300">{s.full_name}</span>
                <Badge tone="emerald">Terminé</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
