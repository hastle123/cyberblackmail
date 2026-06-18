import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, validateQuery, enforceRateLimit } from "@/lib/api";

type GraphNode = {
  id: string;
  type: "article" | "actor" | "company" | "ioc" | "cve" | "ransomware";
  label: string;
  data: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
};

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "graph");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const parsed = validateQuery(querySchema, {
      limit: searchParams.get("limit") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const articles = await prisma.article.findMany({
      take: parsed.limit,
      orderBy: { publishedAt: "desc" },
      include: {
        actors: { select: { actorId: true, actor: { select: { id: true, slug: true, name: true, type: true } } } },
        companies: { select: { companyId: true, company: { select: { id: true, slug: true, name: true } } } },
        iocs: { select: { iocId: true, ioc: { select: { id: true, type: true, value: true, threatLevel: true } } } },
        cves: { select: { cveId: true, cve: { select: { id: true, cveId: true, severity: true, cvssScore: true } } } },
      },
    });

    const actorIds = new Set<string>();
    const companyIds = new Set<string>();
    const iocIds = new Set<string>();
    const cveIds = new Set<string>();

    for (const article of articles) {
      for (const { actorId } of article.actors) actorIds.add(actorId);
      for (const { companyId } of article.companies) companyIds.add(companyId);
      for (const { iocId } of article.iocs) iocIds.add(iocId);
      for (const { cveId } of article.cves) cveIds.add(cveId);
    }

    const ransomwareGroups =
      actorIds.size > 0
        ? await prisma.ransomwareGroup.findMany({
            where: { actorId: { in: [...actorIds] } },
            select: { id: true, slug: true, name: true, status: true, actorId: true },
          })
        : [];

    const nodeMap = new Map<string, GraphNode>();
    const edgeSet = new Set<string>();
    const edges: GraphEdge[] = [];

    const addNode = (node: GraphNode) => {
      if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
    };

    const addEdge = (source: string, target: string, type: string) => {
      const id = `${source}->${target}:${type}`;
      if (edgeSet.has(id)) return;
      edgeSet.add(id);
      edges.push({ id, source, target, type });
    };

    for (const article of articles) {
      const articleNodeId = `article:${article.id}`;
      addNode({
        id: articleNodeId,
        type: "article",
        label: article.title,
        data: {
          slug: article.slug,
          severity: article.severity,
          category: article.category,
          publishedAt: article.publishedAt,
        },
      });

      for (const { actorId, actor } of article.actors) {
        const actorNodeId = `actor:${actorId}`;
        addNode({
          id: actorNodeId,
          type: "actor",
          label: actor.name,
          data: { slug: actor.slug, actorType: actor.type },
        });
        addEdge(articleNodeId, actorNodeId, "attributed_to");
      }

      for (const { companyId, company } of article.companies) {
        const companyNodeId = `company:${companyId}`;
        addNode({
          id: companyNodeId,
          type: "company",
          label: company.name,
          data: { slug: company.slug },
        });
        addEdge(articleNodeId, companyNodeId, "targets");
      }

      for (const { iocId, ioc } of article.iocs) {
        const iocNodeId = `ioc:${iocId}`;
        addNode({
          id: iocNodeId,
          type: "ioc",
          label: ioc.value,
          data: { iocType: ioc.type, threatLevel: ioc.threatLevel },
        });
        addEdge(articleNodeId, iocNodeId, "contains_ioc");
      }

      for (const { cveId, cve } of article.cves) {
        const cveNodeId = `cve:${cveId}`;
        addNode({
          id: cveNodeId,
          type: "cve",
          label: cve.cveId,
          data: { severity: cve.severity, cvssScore: cve.cvssScore },
        });
        addEdge(articleNodeId, cveNodeId, "exploits");
      }
    }

    for (const group of ransomwareGroups) {
      const groupNodeId = `ransomware:${group.id}`;
      addNode({
        id: groupNodeId,
        type: "ransomware",
        label: group.name,
        data: { slug: group.slug, status: group.status },
      });
      if (group.actorId) {
        addEdge(`actor:${group.actorId}`, groupNodeId, "operates");
      }
    }

    return apiSuccess({
      nodes: [...nodeMap.values()],
      edges,
    });
  } catch (error) {
    console.error("[GET /api/graph]", error);
    return apiError("Internal server error", 500);
  }
}
