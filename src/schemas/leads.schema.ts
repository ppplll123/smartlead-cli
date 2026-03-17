import { z } from "zod";

export const LeadSchema = z.object({
  id: z.coerce.number().nullish(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  email: z.string().nullish(),
  phone_number: z.string().nullish(),
  company_name: z.string().nullish(),
  website: z.string().nullish(),
  location: z.string().nullish(),
  linkedin_profile: z.string().nullish(),
  company_url: z.string().nullish(),
  custom_fields: z.unknown().nullish(),
  is_unsubscribed: z.boolean().nullish(),
}).passthrough();

export const LeadListSchema = z.array(LeadSchema);

export const LeadCampaignDataSchema = z.object({
  campaign_lead_map_id: z.coerce.number().nullish(),
  campaign_id: z.coerce.number().nullish(),
  campaign_name: z.string().nullish(),
  client_id: z.coerce.number().nullish(),
  lead_category_id: z.coerce.number().nullish(),
}).passthrough();

export const LeadByEmailSchema = LeadSchema.extend({
  lead_campaign_data: z.array(LeadCampaignDataSchema).nullish(),
}).passthrough();

export const AllLeadsResponseSchema = z.object({
  ok: z.boolean().nullish(),
  data: z.object({
    leads: z.array(LeadSchema).nullish(),
  }).passthrough().nullish(),
}).passthrough();

export const CampaignLeadsSchema = z.object({
  total_leads: z.coerce.number().nullish(),
  data: z.array(z.object({
    campaign_lead_map_id: z.coerce.number().nullish(),
    lead_category_id: z.coerce.number().nullish(),
    status: z.string().nullish(),
    lead: z.object({
      id: z.coerce.number().nullish(),
      first_name: z.string().nullish(),
      last_name: z.string().nullish(),
      email: z.string().nullish(),
    }).passthrough().nullish(),
  }).passthrough()).nullish(),
}).passthrough();

export const LeadCategoriesSchema = z.array(z.object({
  id: z.coerce.number(),
  name: z.string().nullish(),
}).passthrough());

export const BlocklistSchema = z.array(z.object({
  id: z.coerce.number().nullish(),
  email_or_domain: z.string().nullish(),
  created_at: z.string().nullish(),
  source: z.string().nullish(),
  client_id: z.coerce.number().nullish(),
}).passthrough());

export const OkMessageSchema = z.object({
  ok: z.boolean().nullish(),
  message: z.string().nullish(),
}).passthrough();
