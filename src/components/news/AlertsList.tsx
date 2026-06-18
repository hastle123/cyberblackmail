import { getLocale, getTranslations } from "next-intl/server";
import { SeverityBadge } from "@/components/intel/SeverityBadge";
import { editorial } from "@/lib/editorial";
import { formatRelativeTime } from "@/lib/constants";
import type { Severity } from "@prisma/client";

type Alert = {
  id: string;
  message: string;
  severity: Severity;
  createdAt: Date | string;
};

export async function AlertsList({ alerts }: { alerts: Alert[] }) {
  const locale = await getLocale();
  const t = await getTranslations("alerts");

  if (alerts.length === 0) {
    return <p className={editorial.body}>{t("empty")}</p>;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {alerts.map((alert) => (
        <li key={alert.id} className="py-4 first:pt-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <span className={editorial.byline}>{formatRelativeTime(alert.createdAt, locale)}</span>
          </div>
          <p className="text-base leading-snug text-[#d4d4d4]">{alert.message}</p>
        </li>
      ))}
    </ul>
  );
}
