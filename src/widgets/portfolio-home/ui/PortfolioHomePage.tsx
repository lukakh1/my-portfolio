import { ProjectCardGlowRoot } from "@/features/project-card-glow";
import { RevealOnScroll } from "@/features/reveal-on-scroll";
import { ScrollSpyNav } from "@/features/scroll-spy-nav";
import { SmoothAnchorScroll } from "@/features/smooth-anchor-scroll";
import { StatCounters } from "@/features/stat-counter";
import { PortfolioAbout } from "@/widgets/portfolio-about";
import { PortfolioBackground } from "@/widgets/portfolio-background";
import { PortfolioContact } from "@/widgets/portfolio-contact";
import { PortfolioEducation } from "@/widgets/portfolio-education";
import { PortfolioExperience } from "@/widgets/portfolio-experience";
import { PortfolioFooter } from "@/widgets/portfolio-footer";
import { PortfolioHero } from "@/widgets/portfolio-hero";
import { PortfolioNav } from "@/widgets/portfolio-nav";
import { PortfolioPrintHeader } from "@/widgets/portfolio-print-header";
import { PortfolioProjects } from "@/widgets/portfolio-projects";
import { PortfolioSkills } from "@/widgets/portfolio-skills";
import { PortfolioStats } from "@/widgets/portfolio-stats";

export function PortfolioHomePage() {
  return (
    <>
      <ScrollSpyNav />
      <SmoothAnchorScroll />
      <RevealOnScroll />
      <StatCounters />
      <ProjectCardGlowRoot />
      <PortfolioBackground />
      <PortfolioPrintHeader />
      <PortfolioNav />
      <main id="top">
        <PortfolioHero />
        <PortfolioStats />
        <PortfolioAbout />
        <PortfolioExperience />
        <PortfolioSkills />
        <PortfolioProjects />
        <PortfolioEducation />
        <PortfolioContact />
        <PortfolioFooter />
      </main>
    </>
  );
}
