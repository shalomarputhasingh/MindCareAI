import type { Metadata } from "next";

import { MoodTrackerPage } from "@/features/mood/components/mood-tracker-page";

export const metadata: Metadata = {
  title: "Mood tracker",
};

export default function MoodPage() {
  return <MoodTrackerPage />;
}
