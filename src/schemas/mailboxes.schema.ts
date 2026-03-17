import { z } from "zod";

const WarmupDetailsSchema = z.object({
  id: z.coerce.number().nullish(),
  status: z.string().nullish(),
  max_email_per_day: z.coerce.number().nullish(),
  warmup_min_count: z.coerce.number().nullish(),
  warmup_max_count: z.coerce.number().nullish(),
  reply_rate: z.coerce.number().nullish(),
  is_warmup_blocked: z.boolean().nullish(),
  blocked_reason: z.string().nullish(),
  warmup_reputation: z.coerce.number().nullish(),
  total_sent_count: z.coerce.number().nullish(),
  total_spam_count: z.coerce.number().nullish(),
}).passthrough();

export const EmailAccountSchema = z.object({
  id: z.coerce.number(),
  from_name: z.string().nullish(),
  from_email: z.string().nullish(),
  username: z.string().nullish(),
  smtp_host: z.string().nullish(),
  smtp_port: z.coerce.number().nullish(),
  imap_host: z.string().nullish(),
  imap_port: z.coerce.number().nullish(),
  message_per_day: z.coerce.number().nullish(),
  type: z.string().nullish(),
  is_smtp_success: z.boolean().nullish(),
  is_imap_success: z.boolean().nullish(),
  is_suspended: z.boolean().nullish(),
  client_id: z.coerce.number().nullish(),
  daily_sent_count: z.coerce.number().nullish(),
  warmup_details: WarmupDetailsSchema.nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
}).passthrough();

export const EmailAccountListSchema = z.array(EmailAccountSchema);

export const EmailAccountByIdSchema = EmailAccountSchema.extend({
  signature: z.string().nullish(),
  custom_tracking_domain: z.string().nullish(),
  bcc_email: z.string().nullish(),
  campaign_ids: z.array(z.coerce.number()).nullish(),
  tags: z.array(z.object({
    id: z.coerce.number(),
    name: z.string().nullish(),
  }).passthrough()).nullish(),
}).passthrough();

export const WarmupStatsSchema = z.unknown();

export const TagMappingResponseSchema = z.object({
  ok: z.boolean().nullish(),
  message: z.string().nullish(),
}).passthrough();
