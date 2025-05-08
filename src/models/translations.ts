import { db } from "./connection";

export const getTranslations = async () => {
    try {
        const result = (await db.execute({
            sql: "SELECT name FROM translation;"
        })).rows;
        return result.map(r => r.name?.toString()).filter(r => r !== undefined);
    } catch {
        throw new Error("Failed to get translations");
    }
};