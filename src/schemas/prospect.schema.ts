import { z } from "zod";

export const LookupItemSchema = z.object({
  id: z.number().nullish(),
}).passthrough();

export const LookupListSchema = z.array(LookupItemSchema);

export const SearchResultSchema = z.object({
  scroll_id: z.string().nullish(),
  filter_id: z.number().nullish(),
  total_count: z.number().nullish(),
  data: z.array(z.object({
    id: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().nullish(),
    title: z.string().nullish(),
    company_name: z.string().nullish(),
    company_domain: z.string().nullish(),
  }).passthrough()).nullish(),
}).passthrough();

export const FetchResultSchema = z.object({
  filter_id: z.number().nullish(),
  data: z.array(z.object({
    id: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().nullish(),
    verification_status: z.string().nullish(),
  }).passthrough()).nullish(),
}).passthrough();

export const FindEmailsSchema = z.array(z.object({
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  company_domain: z.string().nullish(),
  email: z.string().nullish(),
  status: z.string().nullish(),
  verification_status: z.string().nullish(),
}).passthrough());

export const ReviewResultSchema = z.object({
  filter_id: z.number().nullish(),
  records_updated: z.number().nullish(),
}).passthrough();

export const SavedSearchesSchema = z.object({
  savedSearches: z.array(z.object({
    id: z.number().nullish(),
    search_string: z.string().nullish(),
  }).passthrough()).nullish(),
  totalCount: z.number().nullish(),
}).passthrough();

export const RecentSearchesSchema = z.object({
  recentSearches: z.array(z.unknown()).nullish(),
  totalCount: z.number().nullish(),
}).passthrough();

export const FetchedSearchesSchema = z.object({
  fetchedLeads: z.array(z.unknown()).nullish(),
  totalCount: z.number().nullish(),
}).passthrough();

export const SearchAnalyticsSchema = z.object({
  leadsFound: z.number().nullish(),
  emailsFetched: z.number().nullish(),
  availableCredits: z.number().nullish(),
  leadsFoundToday: z.number().nullish(),
}).passthrough();

export const ReplyAnalyticsSchema = z.object({
  currentMonth: z.number().nullish(),
  previousMonth: z.number().nullish(),
  percentage_change: z.number().nullish(),
  trend: z.string().nullish(),
}).passthrough();

export const OkMessageSchema = z.object({
  success: z.boolean().nullish(),
  message: z.string().nullish(),
}).passthrough();
