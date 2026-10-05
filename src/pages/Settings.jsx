import { useEffect, useState } from "react";
import { Icon } from "../components/icons";
import { Badge, ConfirmModal, Field, Modal, btnGhost, btnPrimary, inputCls } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../utils";
import * as vehiclesApi from "../api/vehicles";
import * as settingsApi from "../api/settings";

function VehicleModal({ vehicle, onClose, onSave }) {
  const [plate, setPlate] = useState(vehicle?.plate || "");
  const [model, setModel] = useState(vehicle?.model || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(""); setBusy(true);
    try { await onSave({ plate, model }); onClose(); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"} onClose={onClose}>
      <Field label="Plaque d'immatriculation"><input className={inputCls + " border"} placeholder="Ex: 220 12345 27" value={plate} onChange={(e) => setPlate(e.target.value)} /></Field>
      <Field label="Modèle"><input className={inputCls + " border"} placeholder="Ex: Renault Symbol" value={model} onChange={(e) => setModel(e.target.value)} /></Field>
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      <button disabled={!plate.trim() || !model.trim() || busy} className={btnPrimary + " w-full"} onClick={submit}>{vehicle ? "Enregistrer" : "Ajouter"}</button>
    </Modal>
  );
}

function AdminOnlyNote() {
  return <p className="text-xs text-amber-300/80 bg-amber-500/5 border border-amber-400/20 rounded-lg px-3 py-2 mb-4">Seul l'administrateur peut modifier cette section. Vous pouvez la consulter.</p>;
}

export default function Settings({ notify }) {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [tab, setTab] = useState("info");
  const [info, setInfo] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleModal, setVehicleModal] = useState(null); // {} = new, {vehicle} = edit
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = () => Promise.all([settingsApi.getInfo(), settingsApi.getPricing(), vehiclesApi.listVehicles()])
    .then(([i, p, v]) => { setInfo(i); setPricing(p); setVehicles(v); });

  useEffect(() => { reload().catch((e) => notify(errMsg(e), "error")).finally(() => setLoading(false)); }, []);

  const saveInfo = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.target).entries());
    try { await settingsApi.updateInfo(payload); notify("Informations enregistrées"); reload(); }
    catch (err) { notify(errMsg(err), "error"); }
  };

  const savePricing = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries([...new FormData(e.target).entries()].map(([k, v]) => [k, Number(v)]));
    try { await settingsApi.updatePricing(payload); notify("Grille tarifaire mise à jour"); reload(); }
    catch (err) { notify(errMsg(err), "error"); }
  };

  const saveVehicle = async (payload) => {
    if (vehicleModal.vehicle) await vehiclesApi.updateVehicle(vehicleModal.vehicle.id, payload);
    else await vehiclesApi.createVehicle(payload);
    notify(vehicleModal.vehicle ? "Véhicule modifié" : "Véhicule ajouté à la flotte");
    reload();
  };
  const toggleStatus = async (v) => {
    try {
      await vehiclesApi.updateVehicle(v.id, { status: v.status === "disponible" ? "maintenance" : "disponible" });
      notify(v.status === "disponible" ? v.plate + " passé en maintenance" : v.plate + " de nouveau disponible");
      reload();
    } catch (err) { notify(errMsg(err), "error"); }
  };
  const removeVehicle = async () => {
    try { await vehiclesApi.deleteVehicle(deletingVehicle.id); notify("Véhicule supprimé"); reload(); }
    catch (err) { notify(errMsg(err), "error"); }
  };

  if (loading) return <p className="text-slate-500 text-sm">Chargement...</p>;

  const tabs = [{ k: "info", l: "Informations" }, { k: "fleet", l: "Flotte (Cars)" }, { k: "pricing", l: "Grille Tarifaire" }];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-white">Paramètres</h1>
      <div className="flex rounded-xl bg-white/5 p-1 max-w-md">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={"flex-1 py-2 rounded-lg text-sm font-medium transition-colors " + (tab === t.k ? "bg-emerald-500 text-slate-950" : "text-slate-300")}>{t.l}</button>
        ))}
      </div>

      {tab === "info" && (
        <form onSubmit={saveInfo} className="card p-5 grid sm:grid-cols-2 gap-4">
          {!isAdmin && <div className="sm:col-span-2"><AdminOnlyNote /></div>}
          {[["business_name", "Raison Sociale"], ["agreement_number", "Numéro d'Agrément Officiel"], ["director_name", "Directeur Gérant / Moniteur Principal"],
            ["wilaya", "Wilaya"], ["commune", "Commune"], ["phone", "Téléphone"], ["address", "Adresse du Local"]].map(([name, label]) => (
            <Field key={name} label={label}><input name={name} disabled={!isAdmin} className={inputCls + " border"} defaultValue={info[name] || ""} /></Field>
          ))}
          {isAdmin && <button type="submit" className={btnPrimary + " sm:col-span-2 justify-self-start"}>Enregistrer</button>}
        </form>
      )}

      {tab === "fleet" && (
        <div className="card p-5">
          {!isAdmin && <AdminOnlyNote />}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-white text-sm">Véhicules ({vehicles.length})</h3>
            {isAdmin && <button onClick={() => setVehicleModal({})} className={btnGhost}><Icon name="plus" size={15} /> Ajouter un véhicule</button>}
          </div>
          <div className="space-y-2.5">
            {vehicles.length === 0 && <p className="text-sm text-slate-500">Aucun véhicule enregistré.</p>}
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-300"><Icon name="car" size={16} /></div>
                <div className="flex-1">
                  <div className="text-sm text-slate-200">{v.model}</div>
                  <div className="text-xs text-slate-500">{v.plate}</div>
                </div>
                <button disabled={!isAdmin} onClick={() => toggleStatus(v)} className="disabled:opacity-100 disabled:cursor-default">
                  <Badge tone={v.status === "disponible" ? "emerald" : "amber"}>{v.status === "disponible" ? "Disponible" : "En maintenance"}</Badge>
                </button>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => setVehicleModal({ vehicle: v })} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400"><Icon name="edit" size={14} /></button>
                    <button onClick={() => setDeletingVehicle(v)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-400"><Icon name="trash" size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {vehicleModal && <VehicleModal vehicle={vehicleModal.vehicle} onClose={() => setVehicleModal(null)} onSave={saveVehicle} />}
          {deletingVehicle && (
            <ConfirmModal title="Supprimer ce véhicule ?" message={`${deletingVehicle.model} — ${deletingVehicle.plate}. Impossible si des séances l'utilisent déjà.`} confirmLabel="Supprimer" danger onConfirm={removeVehicle} onClose={() => setDeletingVehicle(null)} />
          )}
        </div>
      )}

      {tab === "pricing" && (
        <form onSubmit={savePricing} className="card p-5 space-y-4">
          {!isAdmin && <AdminOnlyNote />}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 gap-4">
            <div><div className="text-sm text-slate-200 font-medium">Forfait Permis B Standard</div><div className="text-xs text-slate-500 mt-0.5">Comprend code, créneau, circulation</div></div>
            <input name="permit_fee" type="number" min="0" disabled={!isAdmin} defaultValue={pricing.permit_fee} className={inputCls + " border w-32 text-right"} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 gap-4">
            <div><div className="text-sm text-slate-200 font-medium">Heure Supplémentaire de Conduite</div><div className="text-xs text-slate-500 mt-0.5">Facturée par tranche de 60 min au-delà du quota</div></div>
            <input name="extra_hour_fee" type="number" min="0" disabled={!isAdmin} defaultValue={pricing.extra_hour_fee} className={inputCls + " border w-32 text-right"} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-amber-400/20 gap-4">
            <div><div className="text-sm text-slate-200 font-medium">Frais d'Examen</div><div className="text-xs text-amber-300/80 mt-0.5">Informatif seulement — versé à l'examinateur, non comptabilisé dans les paiements de l'école</div></div>
            <input name="exam_fee" type="number" min="0" disabled={!isAdmin} defaultValue={pricing.exam_fee} className={inputCls + " border w-32 text-right"} />
          </div>
          {isAdmin && <button type="submit" className={btnPrimary}>Enregistrer</button>}
        </form>
      )}
    </div>
  );
}
