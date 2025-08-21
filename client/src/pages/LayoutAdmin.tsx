import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

export default function LayoutAdmin() {
  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-100 overflow-y-auto ml-14">
        <Outlet />
      </main>
    </div>
  );
}
