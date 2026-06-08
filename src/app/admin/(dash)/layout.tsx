import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar admin={{ email: admin.email, name: admin.name }} />
      <div className="lg:pl-64">
        <main className="container-kl py-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
