import { Outlet, useLocation } from "react-router-dom";
import TopNav from "../components/TopNav";

export default function DashboardLayout() {
  const location = useLocation();
  const fullBleed = location.pathname === "/sales";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <TopNav />

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div
          key={location.pathname}
          className={`anim-page ${
            fullBleed ? "h-full" : "mx-auto max-w-6xl px-8 py-8"
          }`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
