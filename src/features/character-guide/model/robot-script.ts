import type { RobotSection } from "./robot-store";

/**
 * Everything the robot says, in one editable file. Keep lines SHORT — the
 * bubble is ~280px wide and the typewriter runs at ~28 chars/s, so a line
 * should read in under 4 seconds. Voice: small, friendly, a little cheeky,
 * still recruiter-safe.
 *
 * He now talks a LOT: greets on arrival, quips while traveling, and chats
 * ambiently when you linger (the director rotates `bonus` lines on a timer,
 * then falls back to the global idle pool).
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
    greet: L("hero-greet", "Hey! I'm Robi — Luka built me. Scroll, I'll walk you through."),
    bonus: [
      L("hero-b1", "That's Luka. Full-stack dev. Ships fast, breaks little."),
      L("hero-b2", "Grab the résumé — the violet button right there."),
      L("hero-b3", "No 3D models were downloaded for me. Pure code. Flex."),
      L("hero-b4", "The particles behind me? They spell his name if you ask nicely."),
    ],
  },
  stats: {
    greet: L("stats-greet", "Quick numbers: 6+ years, 7 companies, 10+ apps shipped."),
    bonus: [
      L("stats-b1", "The counters are real. I watched him count."),
      L("stats-b2", "Numbers go up. That's the trend you want."),
      L("stats-b3", "Six years of code. I'm the most recent commit."),
    ],
  },
  about: {
    greet: L("about-greet", "The human behind me — started coding at school, never stopped."),
    bonus: [
      L("about-b1", "He started young. I started four seconds after you opened this page."),
      L("about-b2", "Time zone GMT+4, but honestly? He's always online."),
      L("about-b3", "Fun fact: this card is sticky. I had to learn to stand still."),
    ],
  },
  experience: {
    greet: L("exp-greet", "Career timeline. He's at Alien Lab right now — this card."),
    bonus: [
      L("exp-b1", "Click a card — some of them flip to show the real product."),
      L("exp-b2", "Six companies, zero boring bullet points. Almost."),
      L("exp-b3", "I walk card to card so you don't have to. Teamwork."),
    ],
  },
  skills: {
    greet: L("skills-greet", "The toolbox: React, Next.js, Node… and whatever I'm made of."),
    bonus: [
      L("skills-b1", "Three.js is on that list. Exhibit A: me."),
      L("skills-b2", "Soft skills included — he's nicer than his linter."),
      L("skills-b3", "TypeScript everywhere. Even my feelings are strongly typed."),
    ],
  },
  projects: {
    greet: L("proj-greet", "Side projects — all real, all on GitHub."),
    bonus: [
      L("proj-b1", "Cards open the repos. Stars are appreciated."),
      L("proj-b2", "Built at 2am, refactored at 2pm. The cycle of life."),
      L("proj-b3", "My favorite project is me, but I'm biased."),
    ],
  },
  education: {
    greet: L("edu-greet", "Computer Science at KIU — on a full merit scholarship."),
    bonus: [
      L("edu-b1", "100% scholarship. The robot is proud of his human."),
      L("edu-b2", "Komarovi before that — the math school. Explains a lot."),
      L("edu-b3", "My education was 1280 lines of spring physics. Same energy."),
    ],
  },
  contact: {
    greet: L("contact-greet", "This is the part where you say hi. He actually replies."),
    bonus: [
      L("contact-b1", "Copy the email — I'll wait right here."),
      L("contact-b2", "Recruiters: yes, he's available. I read the hero section."),
      L("contact-b3", "I'd shake your hand but the screen is in the way."),
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
    L("q-fast3", "Hold on, hold on — let me brace."),
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
  /* spoken at the START of a long move, while walking/flying/rappelling */
  travelDown: [
    L("q-tdown1", "Down we go — follow me!"),
    L("q-tdown2", "Next section, this way."),
    L("q-tdown3", "Onwards! Mind the gap."),
    L("q-tdown4", "Rappelling in… style."),
  ],
  travelUp: [
    L("q-tup1", "Back up we go!"),
    L("q-tup2", "Jetpack time. Hold my bolts."),
    L("q-tup3", "Climbing! Don't blink."),
  ],
  travelSide: [
    L("q-tside1", "Walk with me."),
    L("q-tside2", "Over here — better view."),
    L("q-tside3", "Just repositioning. Professionally."),
  ],
  /* ambient self-talk when the visitor lingers quietly */
  idle: [
    L("q-idle1", "Take your time. I'm solar powered. Probably."),
    L("q-idle2", "Psst — click me. I know bonus facts."),
    L("q-idle3", "Luka tuned my walk cycle by hand. Felt that."),
    L("q-idle4", "These pixels aren't going anywhere. Browse away."),
    L("q-idle5", "I'd offer coffee, but I'm 122 pixels tall."),
  ],
  /* intro stage */
  introRopeIn: [L("q-intro-in", "Compiling the good stuff…")],
  introReady: [
    L("q-intro-go", "All set! Click anywhere to come in."),
    L("q-intro-go2", "Ready! Click anywhere — I'll race you."),
  ],
} as const;
