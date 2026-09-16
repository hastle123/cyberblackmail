"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { cn } from "@/lib/constants";
import { useRouter } from "@/i18n/navigation";
import { editorial } from "@/lib/editorial";
import { SEVERITY_HEX } from "@/lib/severity";
import type { Severity } from "@prisma/client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const PULSE_RADIUS: Record<Severity, number> = {
  CRITICAL: 10,
  HIGH: 9,
  MEDIUM: 8,
  LOW: 7,
};

const LEGEND_COLORS = SEVERITY_HEX;

export type MapIncident = {
  lat: number;
  lng: number;
  severity: Severity;
  country: string;
  type: string;
  articleSlug?: string | null;
};

type IncidentInput = MapIncident | {
  lat: number;
  lng: number;
  severity: Severity;
  country: string;
  type: string;
  article?: { slug: string; title?: string } | null;
};

type AttackMapProps = {
  incidents: IncidentInput[];
  className?: string;
  height?: number;
  fullPage?: boolean;
  compact?: boolean;
};

function normalizeIncident(incident: IncidentInput): MapIncident {
  if ("articleSlug" in incident && incident.articleSlug !== undefined) {
    return incident as MapIncident;
  }
  const withArticle = incident as Extract<IncidentInput, { article?: unknown }>;
  return {
    lat: incident.lat,
    lng: incident.lng,
    severity: incident.severity,
    country: incident.country,
    type: incident.type,
    articleSlug: withArticle.article?.slug ?? null,
  };
}

function dedupeByLocation(incidents: MapIncident[]): MapIncident[] {
  const byKey = new Map<string, MapIncident>();
  for (const incident of incidents) {
    const key = `${incident.lat.toFixed(1)}:${incident.lng.toFixed(1)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, incident);
      continue;
    }

    const keepNew = SEVERITY_RANK[incident.severity] >= SEVERITY_RANK[existing.severity];
    const primary = keepNew ? incident : existing;
    const secondary = keepNew ? existing : incident;
    byKey.set(key, {
      ...primary,
      articleSlug: primary.articleSlug ?? secondary.articleSlug,
    });
  }
  return [...byKey.values()];
}

function PulsingMarker({ severity }: { severity: Severity }) {
  const maxR = PULSE_RADIUS[severity];
  const core = 3.5;
  const color = SEVERITY_HEX[severity];
  return (
    <g pointerEvents="none">
      <circle r={maxR} fill={color} opacity={0.3}>
        <animate
          attributeName="r"
          values={`${core + 1};${maxR};${core + 1}`}
          dur="2.5s"
          repeatCount="indefinite"
        />
        <animate attributeName="opacity" values="0.4;0.22;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle r={core} fill={color} stroke="#070708" strokeWidth={1} />
    </g>
  );
}

function MarkerHitTarget({
  articleSlug,
  label,
  onNavigate,
}: {
  articleSlug: string;
  label: string;
  onNavigate: (slug: string) => void;
}) {
  return (
    <circle
      r={14}
      fill="transparent"
      className="cursor-pointer"
      role="link"
      aria-label={label}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(articleSlug);
      }}
    />
  );
}

export function AttackMap({ incidents, className, height = 420, fullPage, compact }: AttackMapProps) {
  const router = useRouter();
  const t = useTranslations("threatMap");
  const tSev = useTranslations("severity");
  const mapHeight = fullPage ? 560 : height;
  const visibleIncidents = useMemo(
    () =>
      dedupeByLocation(
        incidents
          .map(normalizeIncident)
          .filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng)),
      ),
    [incidents],
  );

  // Projection math differs in the last float digits between server and browser,
  // which trips a hydration mismatch; the geo data is fetched client-side anyway.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={cn(`${editorial.panel} relative overflow-hidden`, className)}>
      {!compact && (
        <div className="absolute left-4 top-4 z-10">
          <p className={editorial.sectionTitle}>{t("title")}</p>
          <p className={`mt-1 text-xs text-accent-strong ${editorial.meta}`}>
            {t("activeIncidents", { count: visibleIncidents.length })}
          </p>
        </div>
      )}

      <div style={{ height: mapHeight }} className="w-full bg-[radial-gradient(ellipse_at_center,#0f0f13_0%,#070708_75%)]">
        {mounted && (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: fullPage ? 160 : 140 }}
            width={800}
            height={mapHeight}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup center={[10, 20]} zoom={1}>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#16161b"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth={0.4}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#1f1f25", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {visibleIncidents.map((incident, i) => (
                <Marker key={`${incident.lat}-${incident.lng}-${i}`} coordinates={[incident.lng, incident.lat]}>
                  <g>
                    <PulsingMarker severity={incident.severity} />
                    {incident.articleSlug ? (
                      <MarkerHitTarget
                        articleSlug={incident.articleSlug}
                        label={`${incident.type} — ${incident.country}`}
                        onNavigate={(slug) => router.push(`/intel/${slug}`)}
                      />
                    ) : null}
                    <title>{`${incident.type} — ${incident.country}`}</title>
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {!compact && (
        <div className={`flex flex-wrap items-center gap-4 border-t border-white/[0.08] px-4 py-2 ${editorial.meta}`}>
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LEGEND_COLORS[sev] }}
              />
              <span>{tSev(sev)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
