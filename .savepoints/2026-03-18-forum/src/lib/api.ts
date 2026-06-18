import { NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function apiSuccess<T>(data: T, meta?: Partial<ApiMeta>) {
  return NextResponse.json({
    data,
    meta: meta
      ? {
          page: meta.page ?? 1,
          limit: meta.limit ?? 20,
          total: meta.total ?? 0,
          totalPages: meta.totalPages ?? 0,
        }
      : undefined,
    error: null,
  });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ data: null, meta: null, error: message }, { status });
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(total: number, page: number, limit: number): ApiMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export function validateQuery<T>(schema: ZodSchema<T>, data: unknown): T | NextResponse {
  const result = schema.safeParse(data);
  if (!result.success) {
    return apiError(result.error.errors.map((e) => e.message).join(", "), 422);
  }
  return result.data;
}

export function enforceRateLimit(request: Request, routeKey: string) {
  const ip = getClientIp(request);
  const { success } = rateLimit(`${routeKey}:${ip}`);
  if (!success) return apiError("Too many requests", 429);
  return null;
}
