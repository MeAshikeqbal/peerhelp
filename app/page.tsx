import { PublicNav } from "@/components/nav/PublicNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MarketplacePreview } from "@/components/landing/MarketplacePreview";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";


export default function Home() {
  return (
    <div className="relative min-h-screen bg-background">
      <PublicNav />

      {/* Hero is full-width so the grid background reaches the viewport edges */}
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <HeroSection />
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-16">
        <HowItWorks />
        <MarketplacePreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
