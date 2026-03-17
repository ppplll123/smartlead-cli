import { z } from "zod";

export const WebhookSchema = z.object({
  id: z.coerce.number().nullish(),
  name: z.string().nullish(),
  webhook_url: z.string().nullish(),
  event_types: z.array(z.string()).nullish(),
  categories: z.array(z.string()).nullish(),
}).passthrough();

export const WebhookListSchema = z.array(WebhookSchema);

export const WebhookSummarySchema = z.object({
  total: z.coerce.number().nullish(),
  success: z.coerce.number().nullish(),
  failed: z.coerce.number().nullish(),
}).passthrough();

export const OkResponseSchema = z.object({
  ok: z.boolean().nullish(),
}).passthrough();
