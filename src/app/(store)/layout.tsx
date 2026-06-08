import { CartProvider } from "@/lib/cart";
import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <CartProvider>
      {settings.announcement ? (
        <div className="bg-forest-deep px-4 py-2 text-center text-xs font-medium text-cream sm:text-sm">
          {settings.announcement}
        </div>
      ) : null}
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer storeName={settings.storeName} supportEmail={settings.supportEmail} />
      <CartDrawer />
    </CartProvider>
  );
}
