import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/icons";
import { Badge, Field, btnPrimary, inputCls } from "../components/ui";
import { errMsg } from "../utils";

export default function Login() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(phone, password, remember);
    } catch (err) {
      setError(errMsg(err, "Téléphone ou mot de passe incorrect."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero flex">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1400&auto=format&fit=crop"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35) saturate(0.9)" }}
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050A12] via-[#050A12]/50 to-[#050A12]/10" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-500 text-slate-950 font-display font-extrabold flex items-center justify-center">DZ</div>
            <span className="font-display font-bold text-lg text-white">DriveDZ</span>
          </div>
          <div className="max-w-md">
            <Badge tone="emerald">Suivi en temps réel</Badge>
            <h1 className="font-display text-4xl font-extrabold text-white mt-5 leading-tight">Passez votre permis en toute sérénité.</h1>
            <p className="text-slate-300 mt-4 leading-relaxed">Code de la route, créneau sur circuit officiel et circulation en ville : suivez chaque étape, vos séances et vos examens au même endroit.</p>
          </div>
          <div className="flex gap-3">
            <div className="card px-4 py-2.5 text-xs text-slate-300 flex items-center gap-2"><Icon name="building" size={15} /> Conforme Wilaya &amp; DTT</div>
            <div className="card px-4 py-2.5 text-xs text-slate-300 flex items-center gap-2"><Icon name="lock" size={15} /> Connexion sécurisée</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 sm:p-10">
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-display font-extrabold flex items-center justify-center text-sm">DZ</div>
          <span className="font-display font-bold text-white">DriveDZ</span>
        </div>

        <form onSubmit={submit} className="max-w-sm w-full mx-auto my-auto">
          <h2 className="font-display text-2xl font-bold text-white mb-1.5">Bienvenue sur votre espace</h2>
          <p className="text-sm text-slate-400 mb-6">Candidats et moniteurs : connectez-vous avec votre numéro de téléphone.</p>

          <Field label="Numéro de téléphone">
            <div className="flex">
              <span className="px-3 py-2.5 rounded-l-lg bg-white/5 border border-r-0 border-white/10 text-sm text-slate-400">DZ +213</span>
              <input required inputMode="tel" autoComplete="username" className={inputCls + " rounded-l-none border"} placeholder="0550 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </Field>
          <Field label="Mot de passe">
            <input required type="password" autoComplete="current-password" className={inputCls + " border"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" className="rounded accent-emerald-500" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Rester connecté
            </label>
            <button type="button" onClick={() => setForgot((v) => !v)} className="text-xs text-emerald-400 hover:underline">Mot de passe oublié ?</button>
          </div>
          {forgot && (
            <p className="text-xs text-slate-400 bg-white/5 rounded-lg p-3 mb-4 leading-relaxed">
              Contactez votre moniteur ou l'auto-école : un nouveau mot de passe provisoire vous sera attribué, que vous pourrez ensuite changer depuis votre profil.
            </p>
          )}

          <button type="submit" disabled={loading} className={btnPrimary + " w-full py-3"}>
            {loading ? "Connexion..." : "Se connecter"} <Icon name="chevron" size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
