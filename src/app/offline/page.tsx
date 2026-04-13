import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AppShell } from "@/components/layout/AppShell";
import { PageFooterNav } from "@/components/navigation/PageFooterNav";

export default function OfflinePage() {
  return (
    <AppShell width="3xl">
      <Card>
        <CardHeader
          title="You are offline"
          description="The app shell is available, but this page could not be loaded from cache."
          right={
            <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
              Go Home
            </Link>
          }
        />
        <CardBody className="space-y-2 text-sm text-slate-700">
          <p>Try reconnecting and refresh to access the latest data.</p>
          <p>Your saved calculator inputs in this browser are not deleted.</p>
        </CardBody>
      </Card>
      <PageFooterNav currentHref="/offline" />
    </AppShell>
  );
}
