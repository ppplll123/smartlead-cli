import { z } from "zod";

export const InboxLeadSchema = z.object({
  email_lead_map_id: z.coerce.number().nullish(),
  email_lead_id: z.coerce.number().nullish(),
  lead_first_name: z.string().nullish(),
  lead_last_name: z.string().nullish(),
  lead_email: z.string().nullish(),
  lead_status: z.string().nullish(),
  lead_category_id: z.coerce.number().nullish(),
  last_sent_time: z.string().nullish(),
  last_reply_time: z.string().nullish(),
  has_new_unread_email: z.boolean().nullish(),
  email_account_id: z.coerce.number().nullish(),
  revenue: z.coerce.number().nullish(),
  email_campaign_id: z.coerce.number().nullish(),
  email_campaign_name: z.string().nullish(),
  is_important: z.boolean().nullish(),
  is_archived: z.boolean().nullish(),
  is_snoozed: z.boolean().nullish(),
  team_member_id: z.coerce.number().nullish(),
}).passthrough();

export const InboxViewResponseSchema = z.object({
  ok: z.boolean().nullish(),
  data: z.array(InboxLeadSchema).nullish(),
  offset: z.coerce.number().nullish(),
  limit: z.coerce.number().nullish(),
}).passthrough();

export const UntrackedReplySchema = z.object({
  id: z.union([z.string(), z.number()]).nullish(),
  from_email: z.string().nullish(),
  to_email: z.string().nullish(),
  subject: z.string().nullish(),
}).passthrough();

export const UntrackedRepliesSchema = z.object({
  ok: z.boolean().nullish(),
  data: z.object({
    success: z.boolean().nullish(),
    message: z.string().nullish(),
    data: z.object({
      replies: z.array(UntrackedReplySchema).nullish(),
    }).passthrough().nullish(),
  }).passthrough().nullish(),
}).passthrough();

export const OkMessageSchema = z.object({
  ok: z.boolean().nullish(),
  message: z.string().nullish(),
}).passthrough();

export const OkDataSchema = z.object({
  ok: z.boolean().nullish(),
  data: z.unknown().nullish(),
}).passthrough();
