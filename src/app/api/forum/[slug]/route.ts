import { NextRequest } from "next/server";
import { z } from "zod";
import { ForumModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, enforceRateLimit } from "@/lib/api";

const replySchema = z.object({
  content: z.string().min(2).max(10000),
  authorName: z.string().min(2).max(60),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const topic = await prisma.forumTopic.findFirst({
      where: { slug, moderationStatus: ForumModerationStatus.APPROVED },
      include: {
        category: true,
        posts: {
          where: { moderationStatus: ForumModerationStatus.APPROVED },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { posts: { where: { moderationStatus: ForumModerationStatus.APPROVED } } } },
      },
    });

    if (!topic) return apiError("Topic not found", 404);

    await prisma.forumTopic.update({
      where: { id: topic.id },
      data: { viewCount: { increment: 1 } },
    });

    return apiSuccess({ ...topic, viewCount: topic.viewCount + 1 });
  } catch (error) {
    console.error("[GET /api/forum/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const limited = enforceRateLimit(request, "forum-reply");
    if (limited) return limited;

    const { slug } = await params;
    const topic = await prisma.forumTopic.findFirst({
      where: { slug, moderationStatus: ForumModerationStatus.APPROVED },
    });
    if (!topic) return apiError("Topic not found", 404);
    if (topic.status === "LOCKED" || topic.status === "ARCHIVED") {
      return apiError("Topic is closed", 403);
    }

    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(", "), 422);
    }

    const post = await prisma.forumPost.create({
      data: {
        topicId: topic.id,
        authorName: parsed.data.authorName,
        content: parsed.data.content,
        moderationStatus: ForumModerationStatus.PENDING,
      },
    });

    return apiSuccess({ ...post, pendingModeration: true });
  } catch (error) {
    console.error("[POST /api/forum/[slug]]", error);
    return apiError("Internal server error", 500);
  }
}
