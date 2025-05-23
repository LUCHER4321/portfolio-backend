import { createClient } from "@libsql/client";
import { TOKEN, URL } from "../config";

export const db = createClient({
    url: URL,
    authToken: TOKEN,
});