import { getSettings } from "@/lib/settings";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Store settings"
        subtitle="Storefront identity, shipping rules, and tax."
      />
      <div className="max-w-3xl">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
