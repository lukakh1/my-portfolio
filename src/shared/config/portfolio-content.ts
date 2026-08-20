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
  { href: "#shipping", label: "How I ship" },
  { href: "#projects", label: "Projects" },
  { href: "#education", label: "Education" },
  { href: "#contact", label: "Get in touch", className: "nav-cta" },
];

export const sectionIds = [
  "about",
  "experience",
  "skills",
  "shipping",
  "projects",
  "education",
  "contact",
] as const;

export const heroRoles = [
  "Full-Stack Software Engineer",
  "React & React Native Engineer",
  "Next.js & Node",
  "Shipping since age 15",
] as const;

export const stats = [
  { value: 6, suffix: "+", label: "Years writing code professionally" },
  { value: 6, suffix: "", label: "Companies & teams" },
  { value: 10, suffix: "+", label: "Apps & platforms shipped" },
] as const;

export const profileRows: { key: string; value: string }[] = [
  { key: "Role", value: "Full-Stack Engineer" },
  { key: "Experience", value: "6+ years" },
  { key: "Started", value: "2019, age 15" },
  { key: "Now", value: "Alien Lab" },
  { key: "Degree", value: "B.Sc. CS, KIU" },
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
      {
        strong: "MeetReferral (meetreferral.com)",
        rest: " — a referral platform connecting brands, built solo. Auth, roles and permissions, file uploads, real-time updates, and third-party API integrations.",
      },
      {
        strong: "MyBusiness (mybusiness.ge)",
        rest: " — an e-commerce platform for businesses, built solo, including the payment flow and the multi-tenant data model.",
      },
      "Wrote the GitLab CI pipelines both products run on — lint, typecheck and tests on every merge request, plus dependency scanning and secret detection.",
      "Next.js on Vercel with Supabase underneath; separate dev and prod environments, deploying from Git on merge.",
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
      "Owned database architecture decisions on Payload CMS + Supabase, modeling the schema for product needs; media storage on Cloudflare R2.",
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
      "Next.js + Express, PostgreSQL, AWS S3, deployed to Render and Vercel from GitLab. Live with ~10 organizers and thousands of tickets sold.",
      "Diagnosed a production API failure across the frontend/backend boundary — a frontend request loop was tripping the rate limiter and getting the endpoint blocked — and fixed the request pattern rather than only lifting the block.",
    ],
    product: {
      name: "sTickets",
      url: "https://stickets.ge",
      blurb:
        "An NFT-based event ticketing platform built end to end — an organizer dashboard with an approval workflow, a customer marketplace, a ticket resale flow, live payments (Fastoo), and an on-chain ticket layer kept in sync with PostgreSQL. I built it, deployed it, and kept it running.",
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
    pills: [
      "PostgreSQL",
      "MySQL",
      "Supabase",
      "MongoDB",
      "Firebase",
      "Payload CMS",
    ],
  },
  {
    id: "test",
    title: "Testing",
    pills: ["Playwright", "Jest", "Vitest"],
  },
  {
    id: "cicd",
    title: "CI/CD & Deployment",
    pills: [
      "GitLab CI/CD",
      "Docker",
      "Vercel",
      "Render",
      "AWS S3",
      "Cloudflare R2",
    ],
  },
  {
    id: "infra",
    title: "Infrastructure",
    subtitle: "— built from scratch for university coursework",
    pills: [
      "AWS EC2",
      "nginx",
      "Load balancing",
      "CloudFront",
      "RDS MySQL",
      "Memcached",
      "Linux (Ubuntu)",
    ],
  },
  {
    id: "mon",
    title: "Monitoring & Analytics",
    pills: ["Sentry", "Mixpanel", "PostHog"],
  },
  {
    id: "tools",
    title: "Tools",
    pills: [
      "Git",
      "Nutrient SDK (PSPDFKit)",
      "Postman",
      "Xcode",
      "Android Studio",
    ],
  },
  {
    id: "cs",
    title: "CS Foundations",
    subtitle: "— Kutaisi International University coursework",
    wide: true,
    pills: [
      "Algorithms & Data Structures",
      "Operating Systems & Systems Programming",
      "Computer Organization & Architecture",
      "Theory of Computation",
      "Databases",
      "Software Engineering",
      "DevOps Engineering",
      "Backend Programming with JavaScript",
      "Scripting Languages",
      "AI-Powered Applications",
      "Discrete Structures",
      "Linear Algebra",
    ],
  },
];

/** The "How I ship" section — what happens to the code after it is written. */
export type ShipStep = {
  id: string;
  title: string;
  body: string;
  pills: string[];
  wide?: boolean;
};

export const shipSteps: ShipStep[] = [
  {
    id: "vcs",
    title: "Version control",
    body: "GitLab, with a merge-request workflow. Nothing reaches main without review and a green pipeline behind it.",
    pills: ["GitLab", "Merge requests", "Git"],
  },
  {
    id: "ci",
    title: "CI",
    body: "Pipelines I wrote myself: lint, typecheck and tests on every merge request, plus dependency scanning and secret detection. I used to find those problems at deploy time, which is too late.",
    pills: ["GitLab CI/CD", "Playwright", "Jest", "Vitest"],
  },
  {
    id: "deploy",
    title: "Deployment",
    body: "Separate dev and prod environments, Docker container builds, and automatic deploys from Git to Vercel and Render on merge.",
    pills: ["Docker", "Vercel", "Render", "dev / prod"],
  },
  {
    id: "incident",
    title: "When it breaks",
    wide: true,
    body: "The sTickets API started failing in production. I checked whether the request was even leaving the frontend before touching the backend — isolating which side of the boundary had actually broken — then looked at what Render was returning. A frontend request loop was firing enough calls to trip the rate limiter, which blocked the endpoint. I unblocked it and fixed the request pattern that caused it, instead of leaving the limiter switched off.",
    pills: ["Production debugging", "Rate limiting", "Vercel", "Render"],
  },
];

export type ProjectItem = {
  /** Omitted for work with no public URL — the card renders unlinked. */
  href?: string;
  tag: string;
  title: string;
  description: string;
  pills: string[];
};

export const projects: ProjectItem[] = [
  {
    href: "https://mybusiness.ge",
    tag: "Alien Lab · Live",
    title: "MyBusiness",
    description:
      "An e-commerce platform for businesses, built solo — including the payment flow and the multi-tenant data model. Next.js on Vercel with Supabase underneath.",
    pills: ["Next.js", "Supabase", "Payments"],
  },
  {
    href: "https://meetreferral.com",
    tag: "Alien Lab · Live",
    title: "MeetReferral",
    description:
      "A referral platform connecting brands, built solo. Auth, roles and permissions, file uploads, real-time updates, and third-party API integrations.",
    pills: ["Next.js", "Supabase", "Real-time"],
  },
  {
    href: "https://stickets.ge",
    tag: "Built, deployed & run solo · Live",
    title: "sTickets",
    description:
      "An NFT event ticketing platform I built end to end and operated myself — organizer dashboard, marketplace, resale flow, live payments, and an on-chain ticket layer synced to Postgres.",
    pills: ["Next.js", "Express", "PostgreSQL"],
  },
  {
    tag: "Coursework · KIU 2025–26",
    title: "AWS deployment stack",
    description:
      "Set up and ran the full deployment stack for a coursework application from scratch — EC2 on Ubuntu, nginx as reverse proxy, a load balancer, CloudFront, RDS MySQL and Memcached, containerized with Docker. In use by students and faculty across the year.",
    pills: ["EC2", "nginx", "Load balancer", "RDS"],
  },
  {
    href: "https://kiketischool.ge",
    tag: "Side project · Live",
    title: "Kiketi School",
    description:
      "A website I built and shipped for Kiketi School — a real production site, live and in active use. Payload CMS + Supabase, media on Vercel Blob.",
    pills: ["Payload CMS", "Supabase", "Production"],
  },
  {
    href: "https://github.com/lukakh1",
    tag: "University · TypeScript",
    title: "AI Code Reviewer",
    description:
      "A tool that analyzes submitted code and returns structured review feedback. Built in TypeScript for a university Software Engineering course.",
    pills: ["TypeScript", "AI", "Code review"],
  },
];

export const kiuCoursePills = [
  "Algorithms & Data Structures",
  "Operating Systems & Systems Programming",
  "Computer Organization & Architecture",
  "Theory of Computation",
  "Databases",
  "Software Engineering (theory + practical)",
  "DevOps Engineering",
  "Backend Programming with JavaScript",
  "Scripting Languages",
  "AI-Powered Applications",
  "Product Development for Software Engineers",
  "Discrete Structures",
  "Discrete Probability",
  "Linear Algebra",
  "Analysis for Informatics",
] as const;
