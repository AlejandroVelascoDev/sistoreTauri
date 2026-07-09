import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
