import { NextRequest } from "next/server";
import { z } from "zod";
import { ForumModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  apiSuccess,
  apiError,
  parsePagination,
  paginationMeta,
  validateQuery,
  enforceRateLimit,
} from "@/lib/api";
import { uniqueTopicSlug } from "@/lib/forum-slug";

const querySchema = z.object({
  category: z.string().optional(),
});

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
  authorName: z.string().min(2).max(60),
  categorySlug: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "forum");
    if (limited) return limited;

    const { searchParams } = request.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const parsed = validateQuery(querySchema, {
      category: searchParams.get("category") ?? undefined,
    });
    if (parsed instanceof Response) return parsed;

    const where = {
      moderationStatus: ForumModerationStatus.APPROVED,
      ...(parsed.category ? { category: { slug: parsed.category } } : {}),
    };

    const [topics, total] = await Promise.all([
      prisma.forumTopic.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }, { createdAt: "desc" }],
        include: {
          category: { select: { slug: true, name: true, nameRu: true } },
          _count: { select: { posts: { where: { moderationStatus: ForumModerationStatus.APPROVED } } } },
        },
      }),
      prisma.forumTopic.count({ where }),
    ]);

    return apiSuccess(topics, paginationMeta(total, page, limit));
  } catch (error) {
    console.error("[GET /api/forum]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = enforceRateLimit(request, "forum-post");
    if (limited) return limited;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 422);
    }

    const category = await prisma.forumCategory.findUnique({
      where: { slug: parsed.data.categorySlug },
    });
    if (!category) return apiError("Category not found", 404);

    const slug = await uniqueTopicSlug(parsed.data.title, async (s) => {
      const existing = await prisma.forumTopic.findUnique({ where: { slug: s } });
      return Boolean(existing);
    });

    const topic = await prisma.forumTopic.create({
      data: {
        slug,
        title: parsed.data.title,
        content: parsed.data.content,
        authorName: parsed.data.authorName,
        categoryId: category.id,
        moderationStatus: ForumModerationStatus.PENDING,
        lastReplyAt: null,
      },
      include: {
        category: { select: { slug: true, name: true, nameRu: true } },
        _count: { select: { posts: true } },
      },
    });

    return apiSuccess({ ...topic, pendingModeration: true }, { page: 1, limit: 1, total: 1, totalPages: 1 });
  } catch (error) {
    console.error("[POST /api/forum]", error);
    return apiError("Internal server error", 500);
  }
}
