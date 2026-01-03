import { HeroSection } from "@/components/hero-section";
import { BentoGrid } from "@/components/bento-grid";
import { FeaturesSection } from "@/components/features-section";
import { DemoSection } from "@/components/demo-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black bg-grid">
      <HeroSection />
      <BentoGrid />
      <FeaturesSection />
      <DemoSection />
      <Footer />
    </main>
  );
}
