import { z } from "zod";

export const ClientSchema = z.object({
  id: z.coerce.number().nullish(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  logo: z.string().nullish(),
  logo_url: z.string().nullish(),
  permission: z.array(z.string()).nullish(),
}).passthrough();

export const ClientListSchema = z.array(ClientSchema);

export const ClientCreateSchema = z.object({
  ok: z.boolean().nullish(),
  id: z.coerce.number().nullish(),
}).passthrough();

export const ApiKeySchema = z.object({
  id: z.coerce.number().nullish(),
  client_id: z.coerce.number().nullish(),
  key_name: z.string().nullish(),
  api_key: z.string().nullish(),
  status: z.string().nullish(),
  created_at: z.string().nullish(),
}).passthrough();

export const ApiKeyListSchema = z.object({
  message: z.string().nullish(),
  data: z.array(ApiKeySchema),
}).passthrough();

export const OkResponseSchema = z.object({
  ok: z.boolean().nullish(),
}).passthrough();
