"use server";

import { fetchApi, type ApiResult } from "@/actions/_lib/api";
import { z } from "zod";

const topicStatusSchema = z.enum(["planned", "partial", "implemented"]);

const dbTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: topicStatusSchema,
  summary: z.string(),
  implemented: z.array(z.string()),
  pending: z.array(z.string()),
  recommendation: z.string().optional(),
  data: z.unknown().optional(),
});

const dbTopicsResponseSchema = z.object({
  ok: z.boolean(),
  checkedAt: z.string(),
  module: z.string(),
  topics: z.array(dbTopicSchema),
});

export type DbTopic = z.infer<typeof dbTopicSchema>;
type DbTopicsResponse = z.infer<typeof dbTopicsResponseSchema>;

export async function getDbTopics(): Promise<ApiResult<DbTopicsResponse>> {
  const response = await fetchApi<DbTopicsResponse>("/db-admin/topics");
  if (!response.ok) return response;

  const parsed = dbTopicsResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    return { ok: false, errors: ["La respuesta de administracion de BD es invalida."] };
  }

  return { ok: true, data: parsed.data };
}
