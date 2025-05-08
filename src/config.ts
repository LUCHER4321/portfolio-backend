import 'dotenv/config';

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const URL = process.env.DB_URL ?? "";
export const TOKEN = process.env.DB_TOKEN ?? "";