import { Outlet } from "react-router";
import { Header } from "~/components/layout/Header";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  );
}
