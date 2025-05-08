import { db } from "./connection";

export const validateToken = async (token: string, user: string | undefined = undefined): Promise<boolean> => {
    const addUser = user ? "AND HEX(id) = ?" : "";
    const [validation] = (await db.execute({
        sql: `SELECT token FROM token, user WHERE user_id = id AND HEX(token) = ? ${addUser} GROUP BY token;`,
        args: user ? [token, user] : [token],
    })).rows;
    if(!validation) return false;
    return true;
};