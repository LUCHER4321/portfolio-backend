import 'dotenv/config';

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const URL = process.env.DB_URL ?? "";
export const TOKEN = process.env.DB_TOKEN ?? "";
export const ACCEPTED_ORIGINS = process.env.ACCEPTED_ORIGINS ? process.env.ACCEPTED_ORIGINS.split("||") : [];
export const VERCEL = process.env.VERCEL ?? "";