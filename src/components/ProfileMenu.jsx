import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { Field, Modal, btnPrimary, inputCls } from "./ui";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../api/auth";
import { errMsg } from "../utils";

function ChangePasswordModal({ onClose, notify }) {
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const mismatch = form.confirm && form.next !== form.confirm;
  const submit = async () => {
    setBusy(true);
    try {
      await authApi.changePassword(form.old, form.next);
      notify("Mot de passe modifié");
      onClose();
    } catch (err) {
      notify(errMsg(err), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Changer mon mot de passe" onClose={onClose}>
      <Field label="Ancien mot de passe"><input type="password" className={inputCls + " border"} value={form.old} onChange={(e) => set("old", e.target.value)} /></Field>
      <Field label="Nouveau mot de passe (min. 6 caractères)"><input type="password" className={inputCls + " border"} value={form.next} onChange={(e) => set("next", e.target.value)} /></Field>
      <Field label="Confirmer le nouveau mot de passe" hint={mismatch ? "Les deux mots de passe ne correspondent pas." : undefined}>
        <input type="password" className={inputCls + " border"} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
      </Field>
      <button disabled={busy || !form.old || form.next.length < 6 || form.next !== form.confirm} className={btnPrimary + " w-full"} onClick={submit}>Enregistrer</button>
    </Modal>
  );
}

export default function ProfileMenu({ notify, compact }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (user.full_name || "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = user.role === "admin" ? "Administrateur" : user.role === "instructor" ? "Moniteur" : "Candidat";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2.5 pl-2.5 border-l border-white/10">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-slate-200">{initials}</div>
        {!compact && (
          <div className="hidden sm:block leading-tight text-left">
            <div className="text-sm text-slate-200 font-medium">{user.full_name}</div>
            <div className="text-xs text-slate-500">{roleLabel}</div>
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-60 card p-2 z-50 fade-in">
          <div className="px-2.5 py-2 border-b border-white/5 mb-1">
            <div className="text-sm text-slate-200 font-medium">{user.full_name}</div>
            <div className="text-xs text-slate-500">{user.phone} · {roleLabel}</div>
          </div>
          <button onClick={() => { setOpen(false); setShowPw(true); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">
            <Icon name="key" size={15} /> Changer le mot de passe
          </button>
          <button onClick={logout} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5">
            <Icon name="logout" size={15} /> Déconnexion
          </button>
        </div>
      )}
      {showPw && <ChangePasswordModal onClose={() => setShowPw(false)} notify={notify} />}
    </div>
  );
}
