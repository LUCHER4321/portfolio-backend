import { db } from "./connection";

export const getUser = async (token: string) => {
    try {
        const [result] = (await db.execute({
            sql: "SELECT HEX(id) as id, name FROM user, token WHERE user_id = id and HEX(token) = ? GROUP BY token;",
            args: [token],
        })).rows;
        return {
            id: result.id,
            name: result.name,
        }
    } catch {
        throw new Error("Invalid token");
    }
};