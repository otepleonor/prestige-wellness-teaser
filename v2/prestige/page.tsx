import type { Metadata } from "next";

import { PrestigeHome } from "./prestige-home";

export const metadata: Metadata = {
  title: "Prestige Wellness | Where wellness meets aesthetics",
  description:
    "A demo experience for Prestige Wellness, an aesthetic clinic and wellness spa on 34th Street in BGC.",
};

export default function PrestigePage() {
  return <PrestigeHome />;
}
