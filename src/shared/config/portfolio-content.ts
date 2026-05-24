/** Static portfolio copy and links — single source for widgets */

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@lukakhimshiashvili.com";

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
  { value: 7, suffix: "", label: "Companies & teams" },
  { value: 10, suffix: "+", label: "Apps & platforms shipped" },
] as const;

export const profileRows: { key: string; value: string }[] = [
  { key: "Role", value: "Full-Stack Dev" },
  { key: "Experience", value: "6+ years" },
  { key: "Started", value: "2019, age 15" },
  { key: "Now", value: "Ruby Labs" },
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
    id: "ruby",
    current: true,
    badge: "Current",
    date: "Oct 2024 — Present",
    title: "Software Developer",
    companyAccent: "Ruby Labs",
    companySuffix: " · International product company · Remote",
    bullets: [
      "Building and maintaining production Next.js web applications inside a global, distributed product team.",
      "Working across consumer-facing surfaces with design, backend, and product partners across multiple time zones.",
      "Operating at the scale of a company that ships large-scale digital products to a global audience.",
    ],
    product: {
      name: "Zendocs",
      url: "https://zendocs.com",
      blurb:
        "A documentation product I help build and maintain at Ruby Labs — production Next.js, shipped to a global audience.",
      images: ["/products/zendocs-1.svg", "/products/zendocs-2.svg"],
    },
  },
  {
    id: "stickets",
    date: "Sep 2024 — Jun 2025",
    title: "Full-Stack Developer",
    companyAccent: "sTickets",
    companySuffix: " (contract) · Ticketing platform",
    bullets: [
      "Designed and shipped an end-to-end ticketing platform on Next.js (frontend) and Express.js (backend).",
      "Modeled the database schema, built the REST API surface, and owned the responsive UI from wireframe to production.",
    ],
    product: {
      name: "sTickets",
      url: "https://stickets.ge",
      blurb:
        "An end-to-end ticketing platform — Next.js frontend, Express API, and a database schema I modeled from scratch.",
      images: ["/products/stickets-1.svg", "/products/stickets-2.svg"],
    },
  },
  {
    id: "sakhlamde",
    date: "Feb 2024 — Aug 2024",
    title: "Full-Stack Developer",
    companyAccent: "Sakhlamde",
    companySuffix: " · Real-estate marketplace",
    bullets: [
      "Built a real-estate platform for buying, selling, and renting properties — frontend and backend in Next.js, Supabase as the database.",
      "Owned the listing experience, search, and authenticated user flows top-to-bottom.",
    ],
    product: {
      name: "Sakhlamde",
      blurb:
        "A real-estate marketplace for buying, selling, and renting — Next.js + Supabase, with listings, search, and authenticated flows.",
      images: ["/products/sakhlamde-1.svg", "/products/sakhlamde-2.svg"],
    },
  },
  {
    id: "artron",
    date: "Mar 2023 — Dec 2023",
    title: "Front-End Developer",
    companyAccent: "Artron",
    companySuffix: " · Gym management software",
    bullets: [
      "Built React-based admin panels for gym operators — schedules, members, billing.",
      "Focused on dashboard UX, data visualization, and dense responsive layouts.",
    ],
    product: {
      name: "Artron",
      blurb:
        "Admin dashboards for gym operators — schedules, members, and billing in dense, data-rich React UIs.",
      images: ["/products/artron-1.svg", "/products/artron-2.svg"],
    },
  },
  {
    id: "onstream",
    date: "Feb 2022 — Jun 2022",
    title: "Front-End Developer",
    companyAccent: "OnStream",
    companySuffix: " · Television network platform",
    bullets: [
      "Developed Angular admin UI for a television network's movie scheduling platform.",
      "Shipped interfaces for content scheduling, playback control, and channel management.",
    ],
    product: {
      name: "OnStream",
      blurb:
        "Angular admin UI for a television network — content scheduling, playback control, and channel management.",
      images: ["/products/onstream-1.svg", "/products/onstream-2.svg"],
    },
  },
  {
    id: "burq",
    date: "Mar 2021 — May 2021",
    title: "React Developer",
    companyAccent: "Burq",
    companySuffix: " · Goods delivery platform",
    bullets: [
      "Contributed to the customer-facing React web application for a goods-delivery startup.",
    ],
    product: {
      name: "Burq",
      blurb:
        "Customer-facing React web app for a goods-delivery startup.",
      images: ["/products/burq-1.svg", "/products/burq-2.svg"],
    },
  },
  {
    id: "4twiggers",
    date: "Aug 2019 — Sep 2021 · Where it started, age 15",
    title: "Software Developer",
    companyAccent: "4Twiggers",
    companySuffix: " · Software studio",
    bullets: [
      {
        strong: "Pravis Testebi",
        rest: " — React Native mobile app simulating Georgian driver's-license exams.",
      },
      {
        strong: "Realremote",
        rest: " — React Native app surfacing curated remote-job listings.",
      },
      {
        strong: "Slotstats",
        rest: " — custom D3.js data visualizations for an analytics product, plus several smaller React Native apps that built deep mobile expertise.",
      },
    ],
    product: {
      name: "4Twiggers",
      blurb:
        "Where it started at 15 — Pravis Testebi and Realremote (React Native), plus custom D3.js dashboards for Slotstats.",
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
    pills: ["JavaScript", "TypeScript", "SQL", "Java", "OCaml"],
  },
  {
    id: "fe",
    title: "Frontend",
    pills: ["React", "React Native", "Next.js", "Angular", "Expo"],
  },
  {
    id: "be",
    title: "Backend",
    pills: ["Node.js", "Express.js", "REST APIs", "Auth"],
  },
  {
    id: "db",
    title: "Databases",
    pills: ["PostgreSQL", "MongoDB", "Firebase", "Supabase"],
  },
  {
    id: "cloud",
    title: "Cloud & Hosting",
    pills: ["Vercel", "Render", "AWS"],
  },
  {
    id: "tools",
    title: "Tools",
    pills: [
      "Git",
      "Docker",
      "VS Code",
      "Cursor",
      "Xcode",
      "Android Studio",
      "Postman",
    ],
  },
  {
    id: "cs",
    title: "CS Foundations",
    subtitle:
      "— Kutaisi International University coursework",
    wide: true,
    pills: [
      "Data Structures & Algorithms",
      "Software Engineering",
      "Operating Systems",
      "Computer Architecture",
      "Discrete Structures",
      "Theory of Computation",
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
    href: "https://github.com/lukakh1/next14-blog",
    tag: "Web app · Next.js 14",
    title: "next14-blog",
    description:
      "Full-featured blog platform on Next.js 14 — server components, dynamic routing, and first-class markdown rendering. Designed as a clean reference architecture I can fork into real client work.",
    pills: ["Next.js 14", "RSC", "Markdown"],
  },
  {
    href: "https://github.com/lukakh1/next14-finance-app",
    tag: "Web app · Dashboard",
    title: "next14-finance-app",
    description:
      "A personal-finance tracker with a real dashboard UI, charted spend by category, and the kind of polished data visualization most side projects skip. Next.js 14 end-to-end.",
    pills: ["Next.js 14", "Charts", "UX"],
  },
  {
    href: "https://github.com/lukakh1/nodejs-expressjs-mongodb",
    tag: "Backend · API boilerplate",
    title: "nodejs-expressjs-mongodb",
    description:
      "A production-ready REST API boilerplate — full CRUD, auth middleware, structured error handling, and Mongo integration. The starting point I reach for whenever a new backend is needed.",
    pills: ["Node.js", "Express", "MongoDB", "Auth"],
  },
  {
    href: "https://github.com/lukakh1/react-quiz",
    tag: "Web app · React",
    title: "react-quiz",
    description:
      "An interactive quiz app with score tracking and category filtering — small enough to be a study, polished enough to feel like a product. Built to nail React state patterns.",
    pills: ["React", "State", "UX"],
  },
  {
    href: "https://github.com/lukakh1/usepopcorn",
    tag: "Web app · API",
    title: "usepopcorn",
    description:
      "A movie-tracking app that pulls from the OMDB API — search, rate, and manage a personal watched list. A complete app in miniature: data fetching, persistence, custom hooks.",
    pills: ["React", "OMDB", "Hooks"],
  },
  {
    href: "https://github.com/lukakh1",
    tag: "Tool · Collaboration",
    title: "Interactive Code-Guide Maker",
    description:
      "A TypeScript tool for authoring interactive coding guides — collaborative project I helped build, focused on a clean editor surface and a learner-first reading experience.",
    pills: ["TypeScript", "Editor", "Collab"],
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
