import { getProductsGroupedByCategory } from "@/lib/products";
import { PickYourChill } from "@/components/store/home/PickYourChill";
import { NewsletterCTA } from "@/components/store/home/NewsletterCTA";
import {
  Hero,
  TrustBar,
  ChillSegments,
  WhyKavaLife,
  NotAllKava,
  Nanotech,
  Nootropic,
  OurStory,
  WhySwitching,
  HonoringRoot,
} from "@/components/store/home/sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const grouped = await getProductsGroupedByCategory();
  return (
    <>
      <Hero />
      <TrustBar />
      <PickYourChill grouped={grouped} />
      <ChillSegments />
      <WhyKavaLife />
      <NotAllKava />
      <Nanotech />
      <Nootropic />
      <OurStory />
      <WhySwitching />
      <HonoringRoot />
      <NewsletterCTA />
    </>
  );
}
