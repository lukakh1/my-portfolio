/** Static portfolio copy and links — single source for widgets */

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "lukakhimshiashvili4@gmail.com";

export const urls = {
  github: "https://github.com/lukakh1",
  linkedin:
    "https://www.linkedin.com/in/luka-khimshiashvili-57283224b",
  mailto: `mailto:${contactEmail}`,
  tel: "tel:+995591193540",
} as const;

export type NavLink = { href: string; label: string; className?: string };

export const navLinks: NavLink[] = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#education", label: "Education" },
  { href: "#contact", label: "Get in touch", className: "nav-cta" },
];

export const sectionIds = [
  "about",
  "experience",
  "skills",
  "projects",
  "education",
  "contact",
] as const;

export const heroRoles = [
  "Full-Stack Developer",
  "React & React Native Engineer",
  "Next.js Specialist",
  "Building since age 15",
] as const;

export const stats = [
  { value: 6, suffix: "+", label: "Years writing code professionally" },
  { value: 6, suffix: "", label: "Companies & teams" },
  { value: 10, suffix: "+", label: "Apps & platforms shipped" },
] as const;

export const profileRows: { key: string; value: string }[] = [
  { key: "Role", value: "Full-Stack Dev" },
  { key: "Experience", value: "6+ years" },
  { key: "Started", value: "2019, age 15" },
  { key: "Now", value: "Alien Lab" },
  { key: "Studying", value: "CS, KIU" },
  { key: "Languages", value: "EN · KA" },
  { key: "Time zone", value: "UTC+4" },
];

export type ExperienceProduct = {
  name: string;
  url?: string;
  blurb: string;
  /** Screenshot paths under /public; the first is the card-back preview. */
  images: string[];
};

export type ExperienceEntry = {
  id: string;
  current?: boolean;
  badge?: string;
  date: string;
  title: string;
  companyAccent: string;
  /** Text after the highlighted org name (include leading space or · as needed). */
  companySuffix: string;
  bullets: (string | { strong: string; rest: string })[];
  product?: ExperienceProduct;
};

export const experience: ExperienceEntry[] = [
  {
    id: "alienlab",
    current: true,
    badge: "Current",
    date: "Jun 2026 — Present",
    title: "Software Engineer",
    companyAccent: "Alien Lab",
    companySuffix: " LLC · Tbilisi, Georgia",
    bullets: [
      "Building client and in-house web applications end to end with React, Next.js, and Node.",
    ],
  },
  {
    id: "ruby",
    date: "Sep 2025 — Jun 2026",
    title: "Software Developer",
    companyAccent: "Ruby Labs",
    companySuffix: " · Zendocs · Remote",
    bullets: [
      "Built core product surfaces — the PDF editor, agreements wizard, and reusable templates — on the Nutrient SDK (PSPDFKit).",
      "Built user workspaces and debugged the end-to-end payment flow (PayNext).",
      "Made database architecture decisions on Payload CMS + Supabase, modeling the schema for product needs; media storage on Cloudflare R2.",
      "Drove SEO/GEO improvements to grow organic reach.",
    ],
    product: {
      name: "Zendocs",
      url: "https://zendocs.com",
      blurb:
        "A browser-based PDF platform with 100,000+ monthly users across 40+ countries. I built core surfaces — the PDF editor, agreements wizard, and reusable templates — on the Nutrient SDK (PSPDFKit).",
      images: ["/products/zendocs-1.svg", "/products/zendocs-2.svg"],
    },
  },
  {
    id: "stickets",
    date: "Feb 2025 — Aug 2025",
    title: "Full-Stack Developer",
    companyAccent: "sTickets",
    companySuffix: " · NFT event ticketing",
    bullets: [
      "Built the organizer dashboard (paid and free event publishing with an approval workflow), the customer marketplace, and a ticket resale flow.",
      "Integrated live payments (Fastoo) and kept the on-chain NFT ticket layer in sync with PostgreSQL.",
      "Next.js + Express, PostgreSQL, AWS S3, deployed on Render and Vercel. Live with ~10 organizers and thousands of tickets sold.",
    ],
    product: {
      name: "sTickets",
      url: "https://stickets.ge",
      blurb:
        "An NFT-based event ticketing platform built end to end — an organizer dashboard with an approval workflow, a customer marketplace, a ticket resale flow, live payments (Fastoo), and an on-chain ticket layer kept in sync with PostgreSQL.",
      images: ["/products/stickets-1.svg", "/products/stickets-2.svg"],
    },
  },
  {
    id: "onstream",
    date: "Dec 2023 — May 2024",
    title: "Frontend Developer",
    companyAccent: "OnStream",
    companySuffix: " · Smart-TV movie platform",
    bullets: [
      "Movie scheduling and playback platform for smart TVs.",
      "Built the entire Angular admin dashboard — uploading content and programming what airs on each channel and when.",
    ],
    product: {
      name: "OnStream",
      blurb:
        "A movie scheduling and playback platform for smart TVs. I built the entire Angular admin dashboard — uploading content and programming what airs on each channel and when.",
      images: ["/products/onstream-1.svg", "/products/onstream-2.svg"],
    },
  },
  {
    id: "burq",
    date: "Mar 2021 — Feb 2022",
    title: "Frontend Developer",
    companyAccent: "Burq",
    companySuffix: " (via 4TWIGGERS) · Delivery app",
    bullets: [
      "Customer-facing app for a delivery company.",
      "Owned the React frontend — data fetching, filtering, maps, and core UI.",
    ],
    product: {
      name: "Burq",
      blurb:
        "A customer-facing app for a delivery company. I owned the React frontend — data fetching, filtering, maps, and core UI.",
      images: ["/products/burq-1.svg", "/products/burq-2.svg"],
    },
  },
  {
    id: "4twiggers",
    date: "Jun 2019 — Sep 2022 · Where it started, age 15",
    title: "Frontend Developer",
    companyAccent: "4TWIGGERS",
    companySuffix: " · Software studio · Tbilisi, Georgia",
    bullets: [
      "Built three production apps: Pravis Testebi (driver's-license exam prep, React Native), Spotlight (maps app with a preference-learning recommendation engine), and RealRemote (remote-jobs platform shipped as web + mobile via React Native Web).",
      "Built D3.js data visualizations and casino-data integration for SlotStats, a gambling-analytics product; plus smaller mobile apps.",
    ],
    product: {
      name: "4TWIGGERS",
      blurb:
        "A software studio where it started at 15. Built three production apps — Pravis Testebi (driver's-license exam prep, React Native), Spotlight (a maps app with a preference-learning recommender), and RealRemote (a remote-jobs platform shipped as web + mobile via React Native Web) — plus D3.js data visualizations for SlotStats.",
      images: ["/products/4twiggers-1.svg", "/products/4twiggers-2.svg"],
    },
  },
];

export type SkillCategory = {
  id: string;
  title: string;
  pills: string[];
  wide?: boolean;
  subtitle?: string;
};

export const skillCategories: SkillCategory[] = [
  {
    id: "lang",
    title: "Languages",
    pills: ["TypeScript", "JavaScript", "SQL"],
  },
  {
    id: "fe",
    title: "Frontend",
    pills: ["React", "React Native", "Next.js", "Angular", "Expo"],
  },
  {
    id: "be",
    title: "Backend",
    pills: ["Node.js", "Express.js", "NestJS", "REST APIs", "Auth"],
  },
  {
    id: "db",
    title: "Databases",
    pills: ["PostgreSQL", "MongoDB", "Supabase", "Firebase", "Payload CMS"],
  },
  {
    id: "mon",
    title: "Monitoring & Analytics",
    pills: ["Sentry", "Mixpanel"],
  },
  {
    id: "cloud",
    title: "Cloud & Storage",
    pills: ["Vercel", "Render", "AWS (S3)", "Cloudflare R2"],
  },
  {
    id: "tools",
    title: "Tools",
    pills: [
      "Git",
      "Docker",
      "Nutrient SDK (PSPDFKit)",
      "Postman",
      "Cursor",
      "Xcode",
      "Android Studio",
    ],
  },
  {
    id: "cs",
    title: "CS Foundations",
    subtitle:
      "— Kutaisi International University coursework",
    wide: true,
    pills: [
      "Software Engineering & Design",
      "DevOps",
      "Product Development",
      "AI-Powered Applications",
      "Databases",
      "Computer Architecture",
      "Assembly",
    ],
  },
];

export type ProjectItem = {
  href: string;
  tag: string;
  title: string;
  description: string;
  pills: string[];
};

export const projects: ProjectItem[] = [
  {
    href: "https://github.com/lukakh1",
    tag: "Tool · TypeScript",
    title: "AI Code Reviewer",
    description:
      "A tool that analyzes pasted code and returns structured review feedback. Built in TypeScript for a university Software Engineering course.",
    pills: ["TypeScript", "AI", "Code review"],
  },
  {
    href: "https://kiketischool.ge",
    tag: "Side project · Live",
    title: "Kiketi School",
    description:
      "A website I built and shipped for Kiketi School — a real production site, live and in active use at kiketischool.ge.",
    pills: ["Web", "Production", "Shipped"],
  },
  {
    href: "https://github.com/lukakh1/next14-blog",
    tag: "Practice & Learning",
    title: "next14-blog",
    description:
      "A blog built to learn the Next.js App Router — server components, dynamic routing, and markdown rendering.",
    pills: ["Next.js", "RSC", "Markdown"],
  },
  {
    href: "https://github.com/lukakh1/next14-finance-app",
    tag: "Practice & Learning",
    title: "next14-finance-app",
    description:
      "A personal-finance dashboard built to practice charts and data visualization in Next.js — spend by category, end to end.",
    pills: ["Next.js", "Charts", "UX"],
  },
  {
    href: "https://github.com/lukakh1/react-quiz",
    tag: "Practice & Learning",
    title: "react-quiz",
    description:
      "An interactive quiz app built to practice React state patterns — score tracking, category filtering, and a reducer-driven flow.",
    pills: ["React", "Reducer", "State"],
  },
  {
    href: "https://github.com/lukakh1/usepopcorn",
    tag: "Practice & Learning",
    title: "usepopcorn",
    description:
      "A movie-tracking app built against the OMDB API while learning React — search, rate, and keep a watched list. A study in data fetching and custom hooks.",
    pills: ["React", "OMDB", "Hooks"],
  },
];

export const kiuCoursePills = [
  "DSA",
  "Software Engineering",
  "Operating Systems",
  "Computer Architecture",
  "Discrete Structures",
  "Theory of Computation",
  "SQL",
  "PostgreSQL",
  "Java",
  "OCaml",
  "Assembly",
] as const;
