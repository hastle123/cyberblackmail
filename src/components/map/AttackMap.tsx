"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { SEVERITY_COLORS, cn } from "@/lib/constants";
import { editorial } from "@/lib/editorial";
import type { Severity } from "@prisma/client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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

function PulsingMarker({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <g>
      <circle r={8} fill={color} opacity={0.2}>
        <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r={4} fill={color} stroke="#050505" strokeWidth={1}>
        <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export function AttackMap({ incidents, className, height = 420, fullPage, compact }: AttackMapProps) {
  const router = useRouter();
  const t = useTranslations("threatMap");
  const tSev = useTranslations("severity");
  const mapHeight = fullPage ? 560 : height;
  const validIncidents = useMemo(
    () =>
      incidents
        .map(normalizeIncident)
        .filter((i) => Number.isFinite(i.lat) && Number.isFinite(i.lng)),
    [incidents],
  );

  return (
    <div className={cn(`${editorial.panel} relative overflow-hidden`, className)}>
      {!compact && (
        <div className="absolute left-4 top-4 z-10">
          <p className={editorial.sectionTitle}>{t("title")}</p>
          <p className={`mt-1 text-xs text-[#e52525] ${editorial.meta}`}>
            {t("activeIncidents", { count: validIncidents.length })}
          </p>
        </div>
      )}

      <div style={{ height: mapHeight }} className="w-full bg-[#050505]">
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
                    fill="#141414"
                    stroke="rgba(196, 30, 30, 0.12)"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#1a1a1a", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {validIncidents.map((incident, i) => (
              <Marker key={`${incident.lat}-${incident.lng}-${i}`} coordinates={[incident.lng, incident.lat]}>
                <g
                  className={incident.articleSlug ? "cursor-pointer" : undefined}
                  onClick={
                    incident.articleSlug
                      ? () => router.push(`/intel/${incident.articleSlug}`)
                      : undefined
                  }
                >
                  <PulsingMarker severity={incident.severity} />
                  <title>{`${incident.type} — ${incident.country}`}</title>
                </g>
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {!compact && (
        <div className={`flex flex-wrap items-center gap-4 border-t border-white/[0.08] px-4 py-2 ${editorial.meta}`}>
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS[sev] }}
              />
              <span>{tSev(sev)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
