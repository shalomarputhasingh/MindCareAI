import {
  BookOpen,
  Bike,
  Brain,
  Coffee,
  Dumbbell,
  Flower2,
  Footprints,
  GlassWater,
  Heart,
  Moon,
  Music,
  PenLine,
  Sparkles,
  Sun,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/** Icons offered when creating a custom habit, including the five defaults. */
export const HABIT_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "GlassWater", icon: GlassWater },
  { name: "Footprints", icon: Footprints },
  { name: "Flower2", icon: Flower2 },
  { name: "Moon", icon: Moon },
  { name: "BookOpen", icon: BookOpen },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Sun", icon: Sun },
  { name: "Heart", icon: Heart },
  { name: "Brain", icon: Brain },
  { name: "Coffee", icon: Coffee },
  { name: "Music", icon: Music },
  { name: "PenLine", icon: PenLine },
  { name: "Utensils", icon: Utensils },
  { name: "Bike", icon: Bike },
];

const ICON_LOOKUP = new Map(HABIT_ICON_OPTIONS.map((option) => [option.name, option.icon]));

/** Resolves a stored icon name to a component, falling back for anything unrecognised. */
export function resolveHabitIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICON_LOOKUP.get(name) ?? Sparkles;
}
