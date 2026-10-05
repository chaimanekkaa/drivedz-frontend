import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Toast } from "./components/ui";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Planning from "./pages/Planning";
import Pipeline from "./pages/Pipeline";
import ExamsAdmin from "./pages/ExamsAdmin";
import Settings from "./pages/Settings";
import StudentSpace from "./pages/StudentSpace";

export default function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const notify = (msg, type = "success") => setToast({ msg, type, id: Date.now() });

  if (loading) {
    return <div className="min-h-screen bg-hero flex items-center justify-center text-slate-500 text-sm">Chargement...</div>;
  }
  if (!user) return <Login />;

  const toastEl = <Toast toast={toast} onClose={() => setToast(null)} />;

  if (user.role === "student") {
    return (<><StudentSpace notify={notify} />{toastEl}</>);
  }

  const clear = () => setSearch("");
  const screens = {
    dashboard: <Dashboard setScreen={setScreen} notify={notify} />,
    planning: <Planning notify={notify} search={search} onClearSearch={clear} />,
    pipeline: <Pipeline notify={notify} search={search} onClearSearch={clear} />,
    exams: <ExamsAdmin notify={notify} search={search} onClearSearch={clear} />,
    settings: <Settings notify={notify} />,
  };

  return (
    <>
      <Shell screen={screen} setScreen={setScreen} notify={notify} search={search} onSearchChange={setSearch}>
        {/* key = user.id : recharge les pages quand on bascule Admin <-> Moniteur */}
        <div key={user.id}>{screens[screen]}</div>
      </Shell>
      {toastEl}
    </>
  );
}
