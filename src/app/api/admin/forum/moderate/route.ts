import { NextRequest } from "next/server";
import { ForumModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";
import { isAdminAuthenticated } from "@/lib/forum-admin-auth";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) return apiError("Unauthorized", 401);
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [topics, posts] = await Promise.all([
    prisma.forumTopic.findMany({
      where: { moderationStatus: ForumModerationStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: { category: { select: { slug: true, name: true } } },
    }),
    prisma.forumPost.findMany({
      where: { moderationStatus: ForumModerationStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: {
        topic: { select: { slug: true, title: true, moderationStatus: true } },
      },
    }),
  ]);

  return apiSuccess({ topics, posts });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const type = body.type as "topic" | "post";
  const id = String(body.id ?? "");
  const action = body.action as "approve" | "reject";

  if (!id || (type !== "topic" && type !== "post") || (action !== "approve" && action !== "reject")) {
    return apiError("Invalid payload", 422);
  }

  const status =
    action === "approve" ? ForumModerationStatus.APPROVED : ForumModerationStatus.REJECTED;

  if (type === "topic") {
    const topic = await prisma.forumTopic.findUnique({ where: { id } });
    if (!topic) return apiError("Topic not found", 404);

    const updated = await prisma.forumTopic.update({
      where: { id },
      data: {
        moderationStatus: status,
        ...(action === "approve" ? { lastReplyAt: topic.lastReplyAt ?? topic.createdAt } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: action === "approve" ? "FORUM_TOPIC_APPROVE" : "FORUM_TOPIC_REJECT",
        entity: `forumTopic:${updated.slug}`,
        entityId: updated.id,
      },
    });

    return apiSuccess(updated);
  }

  const post = await prisma.forumPost.update({
    where: { id },
    data: { moderationStatus: status },
    include: { topic: true },
  });

  if (action === "approve") {
    const now = new Date();
    await prisma.forumTopic.update({
      where: { id: post.topicId },
      data: { lastReplyAt: now, updatedAt: now },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: action === "approve" ? "FORUM_POST_APPROVE" : "FORUM_POST_REJECT",
      entity: `forumPost:${post.id}`,
      entityId: post.id,
      metadata: { topicSlug: post.topic.slug },
    },
  });

  return apiSuccess(post);
}
