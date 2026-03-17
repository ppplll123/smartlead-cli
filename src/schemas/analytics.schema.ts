import { z } from "zod";

/** Generic passthrough for analytics — most return free-form stat objects. */
export const AnalyticsResponseSchema = z.unknown();

export const CampaignListAnalyticsSchema = z.array(z.object({
  id: z.coerce.number().nullish(),
  name: z.string().nullish(),
}).passthrough());

export const ClientListAnalyticsSchema = z.array(z.object({
  id: z.coerce.number().nullish(),
  name: z.string().nullish(),
  email: z.string().nullish(),
}).passthrough());

export const OverallStatsSchema = z.object({
  sent_count: z.coerce.number().nullish(),
  open_count: z.coerce.number().nullish(),
  click_count: z.coerce.number().nullish(),
  reply_count: z.coerce.number().nullish(),
  bounce_count: z.coerce.number().nullish(),
}).passthrough();

export const DayWiseStatsSchema = z.array(z.object({
  date: z.string().nullish(),
  sent_count: z.coerce.number().nullish(),
  open_count: z.coerce.number().nullish(),
  click_count: z.coerce.number().nullish(),
  reply_count: z.coerce.number().nullish(),
}).passthrough());

export const MailboxHealthSchema = z.array(z.object({
  email: z.string().nullish(),
  from_name: z.string().nullish(),
  sent_count: z.coerce.number().nullish(),
  open_count: z.coerce.number().nullish(),
  bounce_count: z.coerce.number().nullish(),
  reply_count: z.coerce.number().nullish(),
}).passthrough());

export const CampaignStatusSchema = z.array(z.object({
  status: z.string().nullish(),
  count: z.coerce.number().nullish(),
}).passthrough());

export const MailboxOverallSchema = z.object({
  total: z.coerce.number().nullish(),
  active: z.coerce.number().nullish(),
  inactive: z.coerce.number().nullish(),
}).passthrough();
