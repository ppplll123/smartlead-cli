import { z } from "zod";

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
  unsubscribed_count: num,
  unique_sent_count: num,
  unique_open_count: num,
  unique_click_count: num,
  block_count: num,
  sequence_count: num,
  drafted_count: num,
}).passthrough();

export const AnalyticsByDateSchema = z.object({
  id: z.coerce.number().nullish(),
  name: z.string().nullish(),
  sent_count: num,
  open_count: num,
  click_count: num,
  reply_count: num,
  bounce_count: num,
}).passthrough();

export const OverallStatsSchema = z.object({
  sent_count: num,
  open_count: num,
  click_count: num,
  reply_count: num,
  bounce_count: num,
  total_count: num,
}).passthrough();

export const DayWiseStatsSchema = z.object({
  success: z.boolean().nullish(),
  message: z.string().nullish(),
  data: z.unknown().nullish(),
}).passthrough();

export const LeadsStatisticsSchema = z.object({
  data: z.array(z.object({
    lead_email: z.string().nullish(),
    lead_name: z.string().nullish(),
    sent_count: num,
    open_count: num,
    click_count: num,
    reply_count: num,
  }).passthrough()).nullish(),
  hasMore: z.boolean().nullish(),
  skip: z.coerce.number().nullish(),
  limit: z.coerce.number().nullish(),
}).passthrough();

export const MailboxStatisticsSchema = z.object({
  ok: z.boolean().nullish(),
  data: z.array(z.object({
    email_account_id: z.coerce.number().nullish(),
    from_email: z.string().nullish(),
    sent_count: num,
    open_count: num,
    click_count: num,
    reply_count: num,
    bounce_count: num,
  }).passthrough()),
}).passthrough();
