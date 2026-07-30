"use client";

import { BellOff, BellRing, Flower2, GlassWater, Moon, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/shared/section-card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNotifications, type NotificationPermissionState } from "@/hooks/use-notifications";
import type { NotificationPreferences } from "@/types";

const TOGGLES: {
  key: "water" | "meditation" | "journal" | "sleep";
  label: string;
  hint: string;
  icon: typeof GlassWater;
}[] = [
  { key: "water", label: "Drink water", hint: "A reminder around mid-morning.", icon: GlassWater },
  { key: "meditation", label: "Meditation time", hint: "A short afternoon pause.", icon: Flower2 },
  { key: "journal", label: "Journal reminder", hint: "An evening nudge to write.", icon: NotebookPen },
  { key: "sleep", label: "Sleep reminder", hint: "A late reminder to wind down.", icon: Moon },
];

/**
 * Notification preferences card for the settings page.
 *
 * Handles all three `Notification.permission` states honestly: `denied`
 * disables the toggle and explains it has to be fixed in browser settings,
 * rather than pretending the switch still works.
 */
export function NotificationsCard() {
  const { preferences, update, hydrated, permission, requestPermission, supported } =
    useNotifications();

  async function handleMasterToggle(next: boolean) {
    if (!next) {
      update({ enabled: false });
      return;
    }
    if (!supported) {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    if (permission === "denied") {
      toast.error(
        "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
      );
      return;
    }
    const result = await requestPermission();
    if (result === "granted") {
      update({ enabled: true });
      toast.success("Notifications turned on");
    } else if (result === "denied") {
      toast.error(
        "Notifications weren't allowed. Turn them on in your browser's site settings if you change your mind.",
      );
    }
  }

  const editable = hydrated && supported && permission === "granted" && preferences.enabled;

  return (
    <SectionCard
      title="Notifications"
      description="Gentle reminders for water, meditation, journalling and sleep, sent from this browser."
    >
      <div className="space-y-4">
        <div className="border-border flex items-center justify-between gap-4 rounded-lg border p-3.5">
          <div className="flex items-start gap-2.5">
            {preferences.enabled && permission === "granted" ? (
              <BellRing className="text-brand-strong mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <BellOff className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Enable notifications</Label>
              <p className="type-caption text-xs">
                {permissionMessage(hydrated, supported, permission)}
              </p>
            </div>
          </div>
          <Switch
            id="notifications-enabled"
            checked={hydrated && preferences.enabled && permission === "granted"}
            onCheckedChange={handleMasterToggle}
            disabled={!hydrated || !supported || permission === "denied"}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TOGGLES.map(({ key, label, hint, icon: Icon }) => (
            <div
              key={key}
              className="border-border flex items-center justify-between gap-3 rounded-lg border p-3.5"
            >
              <div className="flex items-start gap-2.5">
                <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="space-y-0.5">
                  <Label htmlFor={`notif-${key}`}>{label}</Label>
                  <p className="type-caption text-xs">{hint}</p>
                </div>
              </div>
              <Switch
                id={`notif-${key}`}
                checked={preferences[key]}
                onCheckedChange={(checked) =>
                  update({ [key]: checked } as Partial<NotificationPreferences>)
                }
                disabled={!editable}
              />
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function permissionMessage(
  hydrated: boolean,
  supported: boolean,
  permission: NotificationPermissionState,
): string {
  if (!hydrated) return "Checking this browser's notification support…";
  if (!supported) return "This browser doesn't support notifications.";
  if (permission === "denied") {
    return "Blocked in your browser. Allow notifications for this site in browser settings to turn this on.";
  }
  if (permission === "granted") return "Sent from this browser while MindCareAI is open.";
  return "Turning this on will ask your browser for permission.";
}
