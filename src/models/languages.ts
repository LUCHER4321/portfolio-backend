import { Row } from "@libsql/client";
import { Language, LanguageModel } from "../types";
import { db } from "./connection";
import { validateToken } from "./token";
import { throwError } from "./throwError";

const toLanguage = (row: Row) => ({
    id: row.id,
    name: row.name,
    image: row.image,
} as Language);

const toLanguages = (rows: Row[]) => rows.map(r => toLanguage(r));

export const languageModel: LanguageModel = {
    getAll: async ({ proy, user }) => {
        if(proy != undefined) {
            const result = (await db.execute({
                sql: "SELECT id, name, image FROM language, lan_proy WHERE id = lan_id AND proy_id = ? GROUP BY id;",
                args: [proy],
            })).rows;
            if(result.length === 0) throw new Error("No projects with that id or no languages in that project");
            return toLanguages(result);
        }
        if(user){
            const result = (await db.execute({
                sql: "SELECT language.id as id, language.name as name, image FROM language, lan_proy, project WHERE language.id = lan_id AND proy_id = project.id AND HEX(project.user_id) = ? GROUP BY language.id;",
                args: [user],
            })).rows;
            if(result.length === 0) throw new Error("No languages with that user");
            return toLanguages(result);
        }
        const result = (await db.execute({
            sql: "SELECT * FROM language;",
        })).rows;
        if(result.length === 0) throw new Error("No languages found");
        return toLanguages(result);
    },
    getById: async ({ id }) => {
        const [result] = (await db.execute({
            sql: "SELECT * FROM language WHERE id = ?;",
            args: [id],
        })).rows;
        if(!result) throw new Error("No languages with that id");
        return toLanguage(result);
    },
    create: async ({ input }) => {
        const {
            token,
            name,
            image,
        } = input;
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const [result] = (await db.execute({
                sql: "INSERT INTO language (name, image) VALUES (?, ?) RETURNING *;",
                args: [name, image],
            })).rows;
            return toLanguage(result);
        } catch(e: any) {
            throwError(e, "Invalid token");
            throw new Error("Error creating language");
        }
    },
    update: async ({ id, input }) => {
        const {
            token,
            name,
            image,
        } = input;
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const fields = [];
            const args = [];
            if(name){
                fields.push("name = ?");
                args.push(name);
            }
            if(image){
                fields.push("image = ?");
                args.push(image)
            }
            if(fields.length === 0) throw new Error("No fields to update");
            args.push(id);
            const [result] = (await db.execute({
                sql: `UPDATE language SET ${fields.join(", ")} WHERE id = ? RETURNING *;`,
                args,
            })).rows;
            return toLanguage(result);
        } catch(e: any) {
            throwError(e, "Invalid token", "No fields to update");
            throw new Error("Error updating language");
        }
    },
    delete: async ({ id, token }) => {
        try{
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const result = await db.execute({
                sql: "DELETE FROM lan_proy WHERE lan_id = ?;DELETE FROM language WHERE id = ?;",
                args: [id, id],
            });
            return result.rowsAffected > 0;
        } catch(e: any) {
            throwError(e, "Invalid token");
            throw new Error("Error deleting language");
        }
    },
}