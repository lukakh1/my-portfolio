import { ClipboardRoot } from "@/features/clipboard";
import { CustomCursor } from "@/features/custom-cursor";
import { DraggableProjectsRoot } from "@/features/draggable-projects";
import { Marquee } from "@/features/marquee";
import { EasterEggRoot } from "@/features/easter-egg";
import { ExperienceModalRoot } from "@/features/experience-modal";
import { LiquidBackdrop } from "@/features/liquid-backdrop";
import { MagneticRoot } from "@/features/magnetic";
import { MobileNavRoot } from "@/features/nav-mobile";
import { PhysicsTextRoot } from "@/features/physics-text";
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
import { PortfolioShipping } from "@/widgets/portfolio-shipping";
import { PortfolioSkills } from "@/widgets/portfolio-skills";
import { PortfolioStats } from "@/widgets/portfolio-stats";

const MARQUEE_ITEMS = [
  "React",
  "React Native",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "GitLab CI",
  "Docker",
  "shipping since 2019",
];

export function PortfolioHomePage() {
  return (
    <>
      {/* First focusable node in the document — every root above renders null. */}
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <SmoothScroll />
      {/* Ambient layers. .bg-fx is the canvas-free fallback and paints first;
          the shader fades in over it once it has a real frame. */}
      <div className="bg-fx" aria-hidden />
      <LiquidBackdrop />
      <div className="grain" aria-hidden />
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
      <MobileNavRoot />
      {/* Drives the hero lockup AND all seven section titles from one loop. */}
      <PhysicsTextRoot />
      <ScrollProgress />
      <CustomCursor />
      <PortfolioPrintHeader />
      <PortfolioNav />
      {/* tabIndex -1 so the skip link can actually move focus here, not just
          scroll. It stays out of the tab order for everyone else. */}
      <main id="top" tabIndex={-1}>
        <PortfolioHero />
        <PortfolioStats />
        <Marquee items={MARQUEE_ITEMS} />
        <PortfolioAbout />
        <PortfolioExperience />
        <PortfolioSkills />
        <PortfolioShipping />
        <PortfolioProjects />
        <PortfolioEducation />
        <PortfolioContact />
        <PortfolioFooter />
      </main>
    </>
  );
}
