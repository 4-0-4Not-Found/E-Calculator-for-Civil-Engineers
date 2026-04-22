import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export function CompressionSectionPlaceholder() {
  return (
    <Card id="compression-section">
      <CardHeader title="Section properties" description="Select an AISC shape to show database properties." />
      <CardBody className="text-sm text-[color:var(--muted)]">—</CardBody>
    </Card>
  );
}
