import { useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { Badge, Loading, ProgressBar, btnGhost } from "../components/ui";
import NotificationBell from "../components/NotificationBell";
import ProfileMenu from "../components/ProfileMenu";
import { useAuth } from "../context/AuthContext";
import { PHASES, phaseLabel } from "../constants";
import { errMsg, fmtDA, fmtDateLong, fmtH, fmtTime, todayIso, waNumber } from "../utils";
import * as usersApi from "../api/users";
import * as planningApi from "../api/planning";
import * as examsApi from "../api/exams";
import * as paymentsApi from "../api/payments";

const STATUS_BADGE = {
  pending: { tone: "amber", label: "Demande envoyée" },
  accepted: { tone: "indigo", label: "Autorisé(e) ✓" },
  refused: { tone: "red", label: "Refusé" },
  passed: { tone: "emerald", label: "Réussi 🎉" },
  failed: { tone: "red", label: "Non réussi" },
};

export default function StudentSpace({ notify }) {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [examSessions, setExamSessions] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const reload = () => Promise.all([
    usersApi.getProgress(user.id),
    planningApi.listSessions({ date_from: todayIso() }),
    examsApi.listExamSessions(),
    examsApi.myRegistrations(),
    paymentsApi.listPayments(user.id),
  ]).then(([p, s, es, mr, pay]) => { setProgress(p); setSessions(s); setExamSessions(es); setMyRegs(mr); setPayments(pay); });

  useEffect(() => { reload().catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false)); }, []);

  if (loading || !progress) return <div className="min-h-screen bg-hero flex items-center justify-center"><Loading /></div>;

  const upcoming = sessions.filter((s) => s.status === "scheduled").sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))[0];
  const pct = Math.round((progress.hours_current / progress.hours_required) * 100);

  const regsForPhase = myRegs.filter((r) => r.phase === progress.current_phase);
  const activeReg = regsForPhase.find((r) => r.status === "pending" || r.status === "accepted");
  const lastResult = !activeReg && regsForPhase.find((r) => r.status === "failed" || r.status === "refused");
  const availableDates = examSessions.filter((e) => e.phase === progress.current_phase && !regsForPhase.some((r) => r.exam_session_id === e.id));

  const requestExam = async (examId) => {
    setRequesting(true);
    try {
      await examsApi.requestExam(examId);
      notify("Demande d'examen envoyée");
      reload();
    } catch (err) {
      notify(errMsg(err), "error");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero">
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/5 sticky top-0 bg-[#060B14]/90 backdrop-blur z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-display font-extrabold flex items-center justify-center text-sm">DZ</div>
          <span className="font-display font-bold text-white text-sm">DriveDZ</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ProfileMenu notify={notify} compact />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-5 sm:p-8 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-display font-bold text-slate-200">
            {user.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">{user.full_name}</h1>
            <p className="text-sm text-slate-400">Candidat Permis B{progress.instructor_name ? " — Moniteur : " + progress.instructor_name : ""}</p>
          </div>
        </div>

        {progress.course_completed ? (
          <div className="card p-6 text-center space-y-2 border-emerald-400/30">
            <div className="text-3xl">🎉</div>
            <h2 className="font-display text-lg font-bold text-emerald-300">Formation terminée !</h2>
            <p className="text-sm text-slate-400">Vous avez validé les 3 étapes du permis B. Félicitations.</p>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="font-display font-bold text-white text-sm mb-4">Parcours Permis B (3 étapes)</h2>
            <div className="flex items-center">
              {progress.phases.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-2 w-20">
                    <div className={"w-11 h-11 rounded-full flex items-center justify-center border-2 " +
                      (s.status === "done" ? "bg-emerald-500 border-emerald-400 text-slate-950" :
                       s.status === "current" ? "border-amber-400 text-amber-300" : "border-white/10 text-slate-600")}>
                      {s.status === "done" ? <Icon name="check" size={18} /> : s.status === "locked" ? <Icon name="lock" size={15} /> : <span className="text-xs font-semibold">{i + 1}</span>}
                    </div>
                    <span className="text-xs text-slate-400 text-center">{PHASES[i].short}</span>
                  </div>
                  {i < 2 && <div className={"flex-1 h-0.5 " + (progress.phases[i].status === "done" ? "bg-emerald-500" : "bg-white/10")} />}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Phase actuelle — {phaseLabel(progress.current_phase)}</span><span>{fmtH(progress.hours_current)} / {fmtH(progress.hours_required)}</span></div>
              <ProgressBar value={pct} tone="amber" />
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <div className="card p-5">
            <h2 className="font-display font-bold text-white text-sm mb-3">Prochaine Séance</h2>
            {upcoming ? (
              <div className="space-y-1.5 text-sm">
                <div className="text-slate-200 font-medium">{fmtDateLong(upcoming.date)} — {fmtTime(upcoming.start_time)}</div>
                <div className="text-slate-400">{phaseLabel(upcoming.phase)} avec {upcoming.instructor_name}</div>
                {upcoming.vehicle_label && <div className="text-slate-400">Véhicule : {upcoming.vehicle_label}</div>}
              </div>
            ) : <p className="text-sm text-slate-500">Aucune séance planifiée pour le moment.</p>}
          </div>

          <div className="card p-5">
            <h2 className="font-display font-bold text-white text-sm mb-3">Examen avec l'Ingénieur</h2>
            {progress.course_completed ? (
              <p className="text-sm text-slate-500">Vous avez terminé toutes les épreuves.</p>
            ) : activeReg ? (
              <div className="space-y-2">
                <Badge tone={STATUS_BADGE[activeReg.status].tone}>{STATUS_BADGE[activeReg.status].label}</Badge>
                <p className="text-xs text-slate-500">{phaseLabel(activeReg.phase)} — {fmtDateLong(activeReg.exam_date)}</p>
                {activeReg.status === "pending" && <p className="text-xs text-slate-500">En attente de la décision de votre moniteur.</p>}
                {activeReg.status === "accepted" && <p className="text-xs text-slate-500">Présentez-vous le jour J ; le résultat sera saisi par votre moniteur.</p>}
              </div>
            ) : !progress.ready_for_exam ? (
              <p className="text-sm text-slate-500">Il vous manque encore {fmtH(progress.hours_required - progress.hours_current)} avant de pouvoir demander l'examen.</p>
            ) : (
              <div className="space-y-2">
                {lastResult && (
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={STATUS_BADGE[lastResult.status].tone}>{STATUS_BADGE[lastResult.status].label}</Badge>
                    <span className="text-xs text-slate-500">le {fmtDateLong(lastResult.exam_date)}</span>
                  </div>
                )}
                {availableDates.length === 0 && <p className="text-xs text-slate-500">Aucune date d'examen programmée pour l'instant — votre moniteur en ajoutera une prochainement.</p>}
                {availableDates.map((e) => (
                  <button key={e.id} disabled={requesting} onClick={() => requestExam(e.id)} className="w-full text-left px-3 py-2.5 rounded-lg border border-white/10 hover:border-emerald-400/40 hover:bg-emerald-500/5 text-sm text-slate-200 flex justify-between items-center disabled:opacity-50">
                    {fmtDateLong(e.date)} <Icon name="chevron" size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display font-bold text-white text-sm mb-3">Situation de Paiement</h2>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-slate-300">{fmtDA(progress.total_paid)} payés</span>
            <span className="text-slate-400">{progress.total_due ? Math.round((progress.total_paid / progress.total_due) * 100) : 0}%</span>
          </div>
          <ProgressBar value={progress.total_due ? (progress.total_paid / progress.total_due) * 100 : 0} tone="emerald" />
          <div className="flex justify-between text-xs text-slate-500 mt-3">
            <span>Reste à payer : <span className={progress.remaining > 0 ? "text-amber-300" : "text-emerald-300"}>{fmtDA(progress.remaining)}</span></span>
            <span>Total dû : {fmtDA(progress.total_due)}</span>
          </div>
          {payments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
              {payments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between text-xs text-slate-400">
                  <span>{fmtDA(p.amount)} — {p.receipt_number}</span>
                  <span>{p.paid_at}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {progress.instructor_phone && (
          <a href={`https://wa.me/${waNumber(progress.instructor_phone)}`} target="_blank" rel="noreferrer" className={btnGhost + " w-full text-emerald-300 border-emerald-400/20"}>
            <Icon name="whatsapp" size={16} /> Message WhatsApp à {progress.instructor_name}
          </a>
        )}
      </main>
    </div>
  );
}
