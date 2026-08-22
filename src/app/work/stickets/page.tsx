import type { Metadata } from "next";

import { CaseSticketsPage } from "@/widgets/portfolio-case-stickets";

export const metadata: Metadata = {
  title: "sTickets — case study | Luka Khimshiashvili",
  description:
    "How sTickets works: an NFT event ticketing platform built end to end — organizer dashboard, marketplace, resale with a 5% organizer royalty, one-time admission QR, and the production incident where the API was fine all along.",
  alternates: { canonical: "/work/stickets" },
  openGraph: {
    type: "article",
    url: "/work/stickets",
    title: "sTickets — case study",
    description:
      "An NFT event ticketing platform built, deployed and operated solo. Ticket lifecycle, the two-sources-of-truth constraint, and a production incident.",
    images: [{ url: "/products/stickets-1.jpg", width: 1440, height: 900 }],
  },
};

export default function Page() {
  return <CaseSticketsPage />;
}
