import { ClipboardRoot } from "@/features/clipboard";
import { CustomCursor } from "@/features/custom-cursor";
import { DraggableProjectsRoot } from "@/features/draggable-projects";
import { Marquee } from "@/features/marquee";
import { EasterEggRoot } from "@/features/easter-egg";
import { ExperienceModalRoot } from "@/features/experience-modal";
import { MagneticRoot } from "@/features/magnetic";
import { ProjectCardGlowRoot } from "@/features/project-card-glow";
import { ScrollFxRoot } from "@/features/scroll-fx";
import { ScrollProgress } from "@/features/scroll-progress";
import { ScrollSpyNav } from "@/features/scroll-spy-nav";
import { SmoothScroll } from "@/features/smooth-scroll";
import { SoundFxRoot } from "@/features/sound";
import { StatCounters } from "@/features/stat-counter";
import { TimelineTrace } from "@/features/timeline-trace";
import { PortfolioAbout } from "@/widgets/portfolio-about";
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

const MARQUEE_ITEMS = [
  "React",
  "React Native",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "shipping since 2019",
];

export function PortfolioHomePage() {
  return (
    <>
      <SmoothScroll />
      <ScrollFxRoot />
      <ScrollSpyNav />
      <StatCounters />
      <DraggableProjectsRoot />
      <SoundFxRoot />
      <EasterEggRoot />
      <ProjectCardGlowRoot />
      <TimelineTrace />
      <ClipboardRoot />
      <ExperienceModalRoot />
      <MagneticRoot />
      <ScrollProgress />
      <CustomCursor />
      <PortfolioPrintHeader />
      <PortfolioNav />
      <main id="top">
        <PortfolioHero />
        <PortfolioStats />
        <Marquee items={MARQUEE_ITEMS} />
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
