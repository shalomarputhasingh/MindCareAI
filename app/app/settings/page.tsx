import { AppPage } from "@/components/shared/app-page";
import { DisclaimerNote } from "@/components/shared/disclaimer-note";
import { PageHeader } from "@/components/shared/page-header";
import { DataCard } from "@/features/backup";
import { NotificationsCard } from "@/features/notifications";
import { AiSettingsCard, AppearanceCard, VoiceCard } from "@/features/settings";

export default function SettingsPage() {
  return (
    <AppPage>
      <PageHeader
        title="Settings"
        description="Your AI provider, model and preferences — all stored on this device."
      />
      <AiSettingsCard />
      <VoiceCard />
      <NotificationsCard />
      <DataCard />
      <AppearanceCard />
      <DisclaimerNote />
    </AppPage>
  );
}
