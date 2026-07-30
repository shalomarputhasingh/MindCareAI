import type { Metadata } from "next";

import { JournalPage } from "@/features/journal/components/journal-page";

export const metadata: Metadata = {
  title: "Daily journal",
};

export default function Journal() {
  return <JournalPage />;
}
