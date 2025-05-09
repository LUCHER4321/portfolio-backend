import { Row } from "@libsql/client/.";
import { Category, CategoryId, CategoryModel, Name } from "../types";
import { db } from "./connection";
import { validateToken } from "./token";
import { throwError } from "./throwError";

const getNames = async (id: CategoryId) => {
    const result = (await db.execute({
        sql: "SELECT translation.name as translation, cat_name.name as name FROM translation, cat_name WHERE tran_id = translation.id AND cat_id = ? GROUP BY translation.id;",
        args: [id],
    })).rows;
    return result.map(r => ({
        translation: r.translation,
        name: r.name
    }) as Name);
};

const toCategory = async (row: Row) => ({
    id: row.id,
    icon: row.icon,
    name: await getNames(row.id as CategoryId),
} as Category);

const toCategoties = async (rows: Row[]) => await Promise.all(rows.map(async r => await toCategory(r)));

export const categoryModel: CategoryModel = {
    getAll: async ({ proy, user }) => {
        if(proy != undefined) {
            const result = (await db.execute({
                sql: "SELECT id, icon FROM category, cat_proy WHERE id = cat_id AND proy_id = ? GROUP BY id;",
                args: [proy],
            })).rows;
            if(result.length === 0) throw new Error("No projects with that id or no categories in that project");
            return await toCategoties(result);
        }
        if(user) {
            const result = (await db.execute({
                sql: "SELECT category.id as id, category.icon as icon FROM category, cat_proy, project WHERE category.id = cat_id AND proy_id = project.id AND HEX(project.user_id) = ? GROUP BY category.id;",
                args: [user],
            })).rows;
            if(result.length === 0) throw new Error("No categories with that user");
            return await toCategoties(result);
        }
        const result = (await db.execute({
            sql: "SELECT * FROM category;",
        })).rows;
        if(result.length === 0) throw new Error("No categories found");
        return await toCategoties(result);
    },
    getById: async ({ id }) => {
        const [result] = (await db.execute({
            sql: "SELECT * FROM category WHERE id = ?;",
            args: [id]
        })).rows;
        if(!result) throw new Error("No categories with that id");
        return await toCategory(result);
    },
    create: async ({ input }) => {
        const {
            token,
            id,
            icon,
            name,
        } = input;
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const [validationId] = (await db.execute({
                sql: "SELECT id FROM category WHERE id = ?;",
                args: [id]
            })).rows;
            if(validationId) throw new Error("Repteated id");
            const [result] = (await db.execute({
                sql: "INSERT INTO category VALUES (?, ?) RETURNING *;",
                args: [id, icon],
            })).rows;
            const forSql = name.map(() => "(?, (SELECT id FROM translation WHERE name = ?), ?)");
            const args = name.flatMap(n => [n.name, n.translation, id]);
            const catResult = (await db.execute({
                sql: `INSERT INTO cat_name (name, tran_id, cat_id) VALUES ${forSql.join(", ")} RETURNING (cat_name.name as name, (SELECT translation.name FROM translation WHERE translation.id = tran_id) as translation);`,
                args,
            })).rows;
            return {
                id: result.id,
                icon: result.id,
                name: catResult.map(r => ({
                    name: r.name,
                    translation: r.translation,
                })),
            } as Category;
        } catch(e: any) {
            throwError(e, "Invalid token", "Repteated id");
            throw new Error("Error creating category");
        }
    },
    update: async ({ id, input }) => {
        const {
            token,
            icon,
            name,
        } = input;
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            if(!icon && !name) throw new Error("No fields to update");
            if(icon) {
                await db.execute({
                    sql: "UPDATE category SET icon = ? WHERE id = ?;",
                    args: [icon, id],
                });
            }
            if(name) {
                const forSql = [
                    name.map(() => "?"),
                    name.map(() => "WHEN ? THEN ?"),
                ];
                const forArgs = [
                    name.map(n => n.translation),
                    name.flatMap(n => [n.translation, n.name]),
                ];
                const sql = `DELETE FROM cat_name WHERE cat_id = ? AND tran_id NOT IN (SELECT id FROM translation WHERE translation.name IN (${forSql[0].join(", ")}));
                UPDATE cat_name SET cat_name.name = CASE translation.name ${forSql[1].join(" ")} END FROM translation WHERE AND tran_id = translation.id AND cat_id = ? AND translation.name IN (${forSql[0].join(", ")});
                INSERT INTO cat_name (name, tran_id, cat_id) SELECT CASE translation.name ${forSql[1].join(" ")} END, translation.id, ? FROM translation LEFT JOIN cat_name ON tran_id = translation.id AND cat_id = ? WHERE translation.name IN (${forSql[0].join(", ")}) AND tran_id IS NULL;`;
                const args = [
                    id,
                    ...forArgs[0],
                    ...forArgs[1],
                    id,
                    ...forArgs[1],
                    id,
                    id,
                    ...forArgs[0],
                ];
                await db.execute({
                    sql,
                    args,
                });
            }
            return await categoryModel.getById({ id });
        } catch(e: any) {
            throwError(e, "Invalid token", "No fields to update");
            throw new Error("Error updating language");
        }
    },
    delete: async ({ id, token }) => {
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const result = await db.execute({
                sql: `DELETE FROM cat_name WHERE cat_id = ?;
                DELETE FROM cat_proy WHERE cat_id = ?;
                DELETE FROM category WHERE id = ?;`,
                args: [id, id, id],
            });
            return result.rowsAffected > 0;
        } catch(e: any) {
            throwError(e, "Invalid token");
            throw new Error("Error deleting category");
        }
    },
};