import { z } from "zod";

const TagSchema = z.object({
  tag_id: z.coerce.number().nullish(),
  tag_name: z.string().nullish(),
  tag_color: z.string().nullish(),
}).passthrough();

export const CampaignSchema = z.object({
  id: z.coerce.number(),
  name: z.string().nullish(),
  status: z.string().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  user_id: z.coerce.number().nullish(),
  min_time_btwn_emails: z.coerce.number().nullish(),
  max_leads_per_day: z.coerce.number().nullish(),
  send_as_plain_text: z.boolean().nullish(),
  follow_up_percentage: z.coerce.number().nullish(),
  parent_campaign_id: z.coerce.number().nullish(),
  client_id: z.coerce.number().nullish(),
  tags: z.array(TagSchema).nullish(),
}).passthrough();

export const CampaignListSchema = z.array(CampaignSchema);

export const CampaignCreateSchema = z.object({
  ok: z.boolean(),
  id: z.coerce.number(),
  name: z.string().nullish(),
  created_at: z.string().nullish(),
}).passthrough();

export const SequenceSchema = z.object({
  id: z.coerce.number(),
  seq_number: z.coerce.number(),
  subject: z.string().nullish(),
  email_body: z.string().nullish(),
  seq_delay_details: z.unknown().nullish(),
  email_campaign_id: z.coerce.number().nullish(),
}).passthrough();

export const SequenceListSchema = z.array(SequenceSchema);

export const CampaignStatsSchema = z.object({
  total_stats: z.coerce.number().nullish(),
  data: z.array(z.object({
    lead_name: z.string().nullish(),
    lead_email: z.string().nullish(),
    lead_category: z.string().nullish(),
    sequence_number: z.coerce.number().nullish(),
    sent_time: z.string().nullish(),
    open_time: z.string().nullish(),
    reply_time: z.string().nullish(),
    is_unsubscribed: z.boolean().nullish(),
    is_bounced: z.boolean().nullish(),
  }).passthrough()).nullish(),
  offset: z.coerce.number().nullish(),
  limit: z.coerce.number().nullish(),
}).passthrough();

/** Coerce string numbers from the API to actual numbers. */
const num = z.coerce.number().nullish();

export const CampaignAnalyticsSchema = z.object({
  id: z.coerce.number().nullish(),
  name: z.string().nullish(),
  status: z.string().nullish(),
  sent_count: num,
  open_count: num,
  click_count: num,
  reply_count: num,
  bounce_count: num,
  total_count: num,
  unique_sent_count: num,
  unique_open_count: num,
  unique_click_count: num,
  unsubscribed_count: num,
  block_count: num,
  sequence_count: num,
  drafted_count: num,
}).passthrough();

export const OkResponseSchema = z.object({
  ok: z.boolean(),
}).passthrough();
