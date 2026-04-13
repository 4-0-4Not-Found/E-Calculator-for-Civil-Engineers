import { AppShell } from "@/components/layout/AppShell";
import { PageFooterNav } from "@/components/navigation/PageFooterNav";
import { HomeDashboard } from "@/components/home/HomeDashboard";

export default function Home() {
  return (
    <AppShell>
      <HomeDashboard />
      <PageFooterNav currentHref="/" />
    </AppShell>
  );
}
