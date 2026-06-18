import { IntelShell } from "@/components/layout/IntelShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ForumModerationPanel } from "@/components/admin/ForumModerationPanel";

export const metadata = { title: "Forum moderation", robots: { index: false, follow: false } };

export default function AdminForumPage() {
  return (
    <IntelShell maxWidth="wide">
      <PageHeader
        title="Forum moderation"
        subtitle="Review and approve topics and replies before they appear on the public forum."
      />
      <ForumModerationPanel />
    </IntelShell>
  );
}
