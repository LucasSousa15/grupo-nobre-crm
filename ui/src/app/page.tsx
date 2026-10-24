import { AppLayout } from "@/layouts/app-layout";
import { OpportunitiesSection } from "@/sections/opportunities/opportunities-section";

export default function Home() {
  return (
    <AppLayout>
      <OpportunitiesSection />
    </AppLayout>
  );
}
