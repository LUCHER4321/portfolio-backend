import { db } from "./connection";

export const getUser = async ({ token }: { token: string }) => {
    try {
        const [result] = (await db.execute({
            sql: "SELECT hex(id) as id, name FROM user, token WHERE user_id = id and token = ?;",
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