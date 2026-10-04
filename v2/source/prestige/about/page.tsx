import type { Metadata } from "next";

import { PrestigeAbout } from "./prestige-about";

export const metadata: Metadata = {
  title: "About Prestige Wellness | Refinement is in the details",
  description:
    "Discover the philosophy, treatment approach, and private wellness experience behind Prestige Wellness by Beyond Massage PH in BGC.",
};

export default function PrestigeAboutPage() {
  return <PrestigeAbout />;
}
