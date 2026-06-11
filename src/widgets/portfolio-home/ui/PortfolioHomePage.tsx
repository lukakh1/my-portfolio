import { CharacterGuide } from "@/features/character-guide";
import { ClipboardRoot } from "@/features/clipboard";
import { CustomCursor } from "@/features/custom-cursor";
import { ExperienceModalRoot } from "@/features/experience-modal";
import { IntroGate } from "@/features/intro-gate";
import { MagneticRoot } from "@/features/magnetic";
import { ProjectCardGlowRoot } from "@/features/project-card-glow";
import { RevealOnScroll } from "@/features/reveal-on-scroll";
import { ScrollProgress } from "@/features/scroll-progress";
import { ScrollSpyNav } from "@/features/scroll-spy-nav";
import { SmoothScroll } from "@/features/smooth-scroll";
import { StatCounters } from "@/features/stat-counter";
import { TimelineTrace } from "@/features/timeline-trace";
import { SceneRootClient } from "@/shared/three";
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
      <IntroGate />
      <SmoothScroll />
      <ScrollSpyNav />
      <RevealOnScroll />
      <StatCounters />
      <ProjectCardGlowRoot />
      <TimelineTrace />
      <ClipboardRoot />
      <ExperienceModalRoot />
      <MagneticRoot />
      <ScrollProgress />
      <CustomCursor />
      <PortfolioBackground />
      <SceneRootClient />
      <CharacterGuide />
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
