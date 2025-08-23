import ResponsiveLayout from "@/components/ResponsiveLayout";
import { Outlet } from "react-router-dom";

export default function InvoicesLayout() {
  return (
    <ResponsiveLayout>
      <Outlet />
    </ResponsiveLayout>
  );
}
