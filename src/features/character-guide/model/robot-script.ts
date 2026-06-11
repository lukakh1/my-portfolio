import type { RobotSection } from "./robot-store";

/**
 * Everything the robot says, in one editable file. Keep lines SHORT — the
 * bubble is ~280px wide and the typewriter runs at ~28 chars/s, so a line
 * should read in under 4 seconds. Voice: small, friendly, a little cheeky,
 * still recruiter-safe.
 */
export interface RobotLine {
  id: string;
  text: string;
}

export interface SectionScript {
  greet: RobotLine;
  bonus: RobotLine[];
}

const L = (id: string, text: string): RobotLine => ({ id, text });

export const SCRIPT: Record<RobotSection, SectionScript> = {
  hero: {
    greet: L("hero-greet", "Hey! I'm Robi — Luka built me. Scroll, I'll give you the tour."),
    bonus: [
      L("hero-b1", "That's Luka. Full-stack dev. Ships fast, breaks little."),
      L("hero-b2", "Grab the résumé — the violet button right there."),
      L("hero-b3", "No 3D models were downloaded for me. Pure code. Flex."),
    ],
  },
  stats: {
    greet: L("stats-greet", "Quick numbers: 6+ years, 7 companies, 10+ apps shipped."),
    bonus: [
      L("stats-b1", "The counters are real. I watched him count."),
      L("stats-b2", "Numbers go up. That's the trend you want."),
    ],
  },
  about: {
    greet: L("about-greet", "The human behind me — started coding at school, never stopped."),
    bonus: [
      L("about-b1", "He started young. I started four seconds after you opened this page."),
      L("about-b2", "Time zone GMT+4, but honestly? He's always online."),
    ],
  },
  experience: {
    greet: L("exp-greet", "Career timeline. He's at Ruby Labs right now — this card."),
    bonus: [
      L("exp-b1", "Click a card — some of them flip to show the real product."),
      L("exp-b2", "Seven companies, zero boring bullet points. Almost."),
    ],
  },
  skills: {
    greet: L("skills-greet", "The toolbox: React, Next.js, Node… and whatever I'm made of."),
    bonus: [
      L("skills-b1", "Three.js is on that list. Exhibit A: me."),
      L("skills-b2", "Soft skills included — he's nicer than his linter."),
    ],
  },
  projects: {
    greet: L("proj-greet", "Side projects — all real, all on GitHub."),
    bonus: [
      L("proj-b1", "Cards open the repos. Stars are appreciated."),
      L("proj-b2", "Built at 2am, refactored at 2pm. The cycle of life."),
    ],
  },
  education: {
    greet: L("edu-greet", "Computer Science at KIU — on a full merit scholarship."),
    bonus: [
      L("edu-b1", "100% scholarship. The robot is proud of his human."),
      L("edu-b2", "Komarovi before that — the math school. Explains a lot."),
    ],
  },
  contact: {
    greet: L("contact-greet", "This is the part where you say hi. He actually replies."),
    bonus: [
      L("contact-b1", "Copy the email — I'll wait right here."),
      L("contact-b2", "Recruiters: yes, he's available. I read the hero section."),
    ],
  },
  footer: {
    greet: L("footer-greet", "That's the tour! I'll be around if you scroll back up. o7"),
    bonus: [L("footer-b1", "End of page — not of the conversation. Say hi!")],
  },
};

export const QUIPS = {
  fastScroll: [
    L("q-fast1", "Whoa — easy on the wheel!"),
    L("q-fast2", "I'm fast, but not THAT fast."),
  ],
  copyEmail: [
    L("q-copy1", "Copied! Talk soon, I hope."),
    L("q-copy2", "Email secured. Excellent choice."),
  ],
  hoverPoke: [
    L("q-poke1", "Hehe — that tickles."),
    L("q-poke2", "Careful, the antenna is sensitive."),
  ],
  backToTop: [
    L("q-top1", "Aaand we're back at the top."),
    L("q-top2", "Round two? I'll do the tour again."),
  ],
} as const;
