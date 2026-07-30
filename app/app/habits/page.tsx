import type { Metadata } from "next";

import { HabitsPage } from "@/features/habits/components/habits-page";

export const metadata: Metadata = {
  title: "Healthy habits",
};

export default function Habits() {
  return <HabitsPage />;
}
