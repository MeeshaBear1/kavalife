import { checkoutMode } from "@/lib/checkout-mode";
import CheckoutForm from "@/components/store/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  // Server-resolved so the form copy ("pay later" vs "Secured by Square") always
  // matches the live checkout behavior — no build-time client env needed.
  return <CheckoutForm reserve={checkoutMode() === "reserve"} />;
}
