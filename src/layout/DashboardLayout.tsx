import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div
          key={location.pathname}
          className="anim-page mx-auto max-w-6xl px-8 py-8"
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
