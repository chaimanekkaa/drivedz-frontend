import { useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { Badge, ConfirmModal, Field, SearchBanner, btnGhost, btnPrimary, inputCls } from "../components/ui";
import { PHASES, phaseLabel } from "../constants";
import { errMsg, fmtDate, todayIso } from "../utils";
import * as examsApi from "../api/exams";

const STATUS_TONE = { pending: "amber", accepted: "indigo", passed: "emerald", failed: "red", refused: "red" };
const STATUS_LABEL = { pending: "En attente", accepted: "Autorisé(e)", passed: "Réussi", failed: "Échoué", refused: "Refusé" };

export default function ExamsAdmin({ notify, search = "", onClearSearch }) {
  const [examSessions, setExamSessions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ phase: "code", date: todayIso() });
  const [deleting, setDeleting] = useState(null);

  const reload = () => Promise.all([examsApi.listExamSessions(), examsApi.allRegistrations()])
    .then(([es, regs]) => { setExamSessions(es); setRegistrations(regs); });

  useEffect(() => { reload().catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false)); }, []);

  const sessionLabel = (id) => {
    const e = examSessions.find((x) => x.id === id);
    return e ? phaseLabel(e.phase) + " — " + fmtDate(e.date) : "Session #" + id;
  };

  const createSession = async () => {
    try {
      await examsApi.createExamSession(form);
      notify("Session d'examen créée et visible côté candidats");
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };

  const removeSession = async () => {
    try {
      await examsApi.deleteExamSession(deleting.id);
      notify("Session supprimée");
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };

  const review = async (reg, status, successMsg) => {
    try {
      await examsApi.reviewRegistration(reg.id, status);
      notify(successMsg);
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    }
  };

  const filterName = (r) => !search.trim() || r.student_name.toLowerCase().includes(search.trim().toLowerCase());
  const pending = registrations.filter((r) => r.status === "pending" && filterName(r));
  const accepted = registrations.filter((r) => r.status === "accepted" && filterName(r));
  const history = registrations.filter((r) => ["passed", "failed", "refused"].includes(r.status) && filterName(r));

  if (loading) return <p className="text-slate-500 text-sm">Chargement...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Examens</h1>
        <p className="text-slate-400 text-sm mt-1">Programmer des sessions d'examen et traiter les demandes de vos candidats.</p>
        <SearchBanner search={search} onClear={onClearSearch} />
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-white text-sm mb-4">Programmer une nouvelle session d'examen</h2>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Épreuve">
            <select className={inputCls + " border"} value={form.phase} onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}>
              {PHASES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" min={todayIso()} className={inputCls + " border"} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></Field>
          <button onClick={createSession} className={btnPrimary}><Icon name="plus" size={16} /> Créer la session</button>
        </div>
        {examSessions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
            {examSessions.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1.5">
                <Badge tone="indigo">{phaseLabel(e.phase)} — {fmtDate(e.date)} {e.registrations_count > 0 ? `(${e.registrations_count})` : ""}</Badge>
                {e.registrations_count === 0 && (
                  <button onClick={() => setDeleting(e)} className="text-slate-500 hover:text-red-400"><Icon name="trash" size={13} /></button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-white text-sm mb-4">Demandes en attente ({pending.length})</h2>
        <div className="space-y-2.5">
          {pending.length === 0 && <p className="text-sm text-slate-500">Aucune demande en attente.</p>}
          {pending.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <div className="text-sm text-slate-200">{r.student_name}</div>
                <div className="text-xs text-slate-500">{phaseLabel(r.phase)} — {fmtDate(r.exam_date)}</div>
              </div>
              <button onClick={() => review(r, "accepted", r.student_name + " est autorisé(e) à passer l'examen")} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400">Autoriser</button>
              <button onClick={() => review(r, "refused", "Demande de " + r.student_name + " refusée")} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5">Refuser</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-white text-sm mb-4">Autorisés — saisir le résultat ({accepted.length})</h2>
        <div className="space-y-2.5">
          {accepted.length === 0 && <p className="text-sm text-slate-500">Aucun candidat autorisé en attente de résultat.</p>}
          {accepted.map((r) => {
            const canJudge = r.exam_date <= todayIso();
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <div className="text-sm text-slate-200">{r.student_name}</div>
                  <div className="text-xs text-slate-500">{phaseLabel(r.phase)} — {fmtDate(r.exam_date)}{!canJudge && " (résultat disponible le jour J)"}</div>
                </div>
                <button disabled={!canJudge} onClick={() => review(r, "passed", r.student_name + " a réussi l'examen 🎉")} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-medium hover:bg-emerald-400 disabled:opacity-30 disabled:pointer-events-none">Réussi</button>
                <button disabled={!canJudge} onClick={() => review(r, "failed", r.student_name + " n'a pas réussi cette fois")} className="text-xs px-3 py-1.5 rounded-lg border border-red-400/30 text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none">Échoué</button>
              </div>
            );
          })}
        </div>
      </div>

      {history.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-bold text-white text-sm mb-4">Historique</h2>
          <div className="space-y-2">
            {history.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] flex-wrap">
                <div className="flex-1 text-sm text-slate-300 min-w-[160px]">{r.student_name} <span className="text-slate-600">— {phaseLabel(r.phase)}, {fmtDate(r.exam_date)}</span></div>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmModal title="Supprimer cette session d'examen ?" message={`${phaseLabel(deleting.phase)} — ${fmtDate(deleting.date)}, sans aucune demande associée.`} confirmLabel="Supprimer" danger onConfirm={removeSession} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
