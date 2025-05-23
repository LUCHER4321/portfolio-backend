import { Row } from "@libsql/client";
import { Name, Project, ProjectModel } from "../types";
import { categoryModel } from "./categories";
import { db } from "./connection";
import { languageModel } from "./languages";
import { validateToken } from "./token";
import { throwError } from "./throwError";

const getNames = async (id: number) => {
    const result = (await db.execute({
        sql: "SELECT translation.name as translation, proy_name.name as name FROM translation, proy_name WHERE tran_id = translation.id AND proy_id = ? GROUP BY translation.id;",
        args: [id],
    })).rows;
    return result.map(r => ({
        translation: r.translation,
        name: r.name
    }) as Name);
};

const getCategories = async (id: number) => await categoryModel.getAll({ proy: id });

const getLanguages = async (id: number) => await languageModel.getAll({ proy: id });

const toProject = async (row: Row) => ({
    id: row.id,
    name: await getNames(row.id as number),
    repository: row.repository,
    website: row.website ?? undefined,
    icon: row.icon ?? undefined,
    languages: await getLanguages(row.id as number),
    categories: await getCategories(row.id as number),
} as Project);

const toProjects = async (rows: Row[]) => await Promise.all(rows.map(async r => await toProject(r)));

export const projectModel: ProjectModel = {
    getAll: async ({ user, cat, lan }) => {
        if(cat && lan) {
            const result = (await db.execute({
                sql: "SELECT project.id AS id, repository, website, icon FROM project, lan_proy, language, cat_proy WHERE HEX(user_id) = ? AND project.id = lan_proy.proy_id AND lan_id = language.id AND name = ? AND project.id = cat_proy.proy_id AND cat_id = ? GROUP BY project.id;",
                args: [user, lan, cat],
            })).rows;
            return await toProjects(result);
        }
        if(cat) {
            const result = (await db.execute({
                sql: "SELECT id, repository, website, icon FROM project, cat_proy WHERE HEX(user_id) = ? AND id = proy_id AND cat_id = ? GROUP BY id;",
                args: [user, cat],
            })).rows;
            return await toProjects(result);
        }
        if(lan) {
            const result = (await db.execute({
                sql: "SELECT project.id AS id, repository, website, icon FROM project, lan_proy, language WHERE HEX(user_id) = ? AND project.id = proy_id AND lan_id = language.id AND name = ? GROUP BY project.id;",
                args: [user, lan],
            })).rows;
            return await toProjects(result);
        }
        const result = (await db.execute({
            sql: "SELECT id, repository, website, icon FROM project WHERE HEX(user_id) = ?;",
            args: [user],
        })).rows;
        return await toProjects(result);
    },
    getById: async ({ id }) => {
        const {
            user,
            id: proy,
         } = id;
         const [result] = (await db.execute({
             sql: "SELECT id, repository, website, icon FROM project WHERE HEX(user_id) = ? AND id = ?;",
             args: [user, proy],
         })).rows;
         if(!result) throw new Error("No projects with that id made by that user");
         return toProject(result);
    },
    create: async ({ user, input }) => {
        const {
            token,
            name,
            repository,
            website,
            icon,
            languages,
            categories,
        } = input;
        try {
            const validation = await validateToken(token, user);
            if(!validation) throw new Error("Invalid token");
            const [result] = (await db.execute({
                sql: "INSERT INTO project (repository, website, icon, user_id) VALUES (?, ?, ?, (SELECT id FROM user WHERE HEX(id) = ?)) RETURNING id, repository, website, icon;",
                args: [repository, website ?? null, icon ?? null, user],
            })).rows;
            const forSql = name.map(() => "(?, (SELECT id FROM translation WHERE name = ?), ?)");
            const forArgs = name.flatMap(n => [n.name, n.translation, result.id]);
            const resultName = (await db.execute({
                sql: `INSERT INTO proy_name (name, tran_id, proy_id) VALUES ${forSql.join(", ")} RETURNING proy_name.name as name, (SELECT translation.name FROM translation WHERE translation.id = tran_id) as translation;`,
                args: forArgs,
            })).rows;
            const forSqlCat = categories.map(() => "(?, ?)");
            const forArgsCat = categories.flatMap(c => [c.id, result.id]);
            await db.execute({
                sql: `INSERT INTO cat_proy (cat_id, proy_id) VALUES ${forSqlCat.join(", ")};`,
                args: forArgsCat,
            });
            const forSqlLan = languages.map(() => "((SELECT id FROM language WHERE name = ?), ?)");
            const forArgsLan = languages.flatMap(l => [l.name, result.id]);
            await db.execute({
                sql: `INSERT INTO lan_proy (lan_id, proy_id) VALUES ${forSqlLan.join(", ")}`,
                args: forArgsLan,
            });
            return {
                id: result.id,
                name: resultName.map(n => ({
                    name: n.name,
                    translation: n.translation,
                })),
                repository: result.repository,
                website: result.website,
                icon: result.icon,
                languages: await getLanguages(Number(result.id)),
                categories: await getCategories(Number(result.id)),
            } as Project;
        } catch(e: any) {
            throwError(e, "Invalid token");
            throw new Error("Error creating project");
        }
    },
    update: async ({ id, input }) => {
         const {
             token,
             name,
             repository,
             website,
             icon,
             languages,
             categories,
         } = input;
         try {
            const validation = await validateToken(token, id.user);
            if(!validation) throw new Error("Invalid token");
            const fields = [];
            const args = [];
            if(repository) {
                fields.push("repository = ?");
                args.push(repository);
            }
            if(website) {
                fields.push("website = ?");
                args.push(website);
            }
            if(icon) {
                fields.push("icon = ?");
                args.push(icon);
            }
            args.push(id.id);
            if(fields.length === 0 && !name && !languages && !categories) throw new Error("No fields to update");
            const [result] = (await db.execute({
                sql: fields.length > 0 ? `UPDATE project SET ${fields.join(", ")} WHERE id = ? RETURNING *;` : "SELECT * FROM project WHERE id = ?;",
                args: fields.length > 0 ? args : [id.id],
            })).rows;
            if(name) {
                const translations = name.map(n => n.translation);
                await db.execute({
                    sql: `DELETE FROM proy_name 
                        WHERE proy_id = ? 
                        AND tran_id NOT IN (
                            SELECT id FROM translation 
                            WHERE name IN (${translations.map(() => '?').join(',')})
                        )`,
                    args: [id.id, ...translations]
                });
                for (const n of name) {
                    await db.execute({
                        sql: `UPDATE proy_name 
                            SET name = ? 
                            WHERE proy_id = ? 
                            AND tran_id = (SELECT id FROM translation WHERE name = ?)`,
                        args: [n.name, id.id, n.translation]
                    });
                }
                for (const n of name) {
                    await db.execute({
                        sql: `INSERT INTO proy_name (name, tran_id, proy_id)
                            SELECT ?, id, ?
                            FROM translation
                            WHERE name = ?
                            AND NOT EXISTS (
                                SELECT 1 FROM proy_name 
                                WHERE proy_id = ? 
                                AND tran_id = translation.id
                            )`,
                        args: [n.name, id.id, n.translation, id.id]
                    });
                }
            }
            if(languages) {
                const forSql = languages.map(() => "?");
                const forArgs = languages.map(l => l.name);
                await db.execute({
                    sql : `DELETE FROM lan_proy WHERE proy_id = ? AND lan_id NOT IN (SELECT id FROM language WHERE name IN (${forSql.join(", ")}));`,
                    args : [id.id, ...forArgs],
                });
                await db.execute({
                    sql : `INSERT INTO lan_proy (lan_id, proy_id) SELECT id, ? FROM language WHERE name IN (${forSql.join(", ")}) AND id NOT IN (SELECT lan_id FROM lan_proy WHERE proy_id = ?);`,
                    args : [id.id, ...forArgs, id.id],
                });
            }
            if(categories) {
                const forSql = categories.map(() => "?");
                const forArgs = categories.map(c => c.id);
                await db.execute({
                    sql: `DELETE FROM cat_proy WHERE proy_id = ? AND cat_id NOT IN (${forSql.join(", ")});`,
                    args: [id.id, ...forArgs],
                });
                await db.execute({
                    sql: `INSERT INTO cat_proy (cat_id, proy_id) SELECT id, ? FROM category WHERE id IN (${forSql.join(", ")}) AND id NOT IN (SELECT cat_id FROM cat_proy WHERE proy_id = ?);`,
                    args: [id.id, ...forArgs, id.id],
                });
            }
            return await toProject(result);
         } catch(e: any) {
            throwError(e, "Invalid token", "No fields to update");
            throw new Error("Error updating project");
         }
    },
    delete: async ({ id, token }) => {
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const deleteSql = [
                "DELETE FROM proy_name WHERE proy_id = ?;",
                "DELETE FROM cat_proy WHERE proy_id = ?;",
                "DELETE FROM lan_proy WHERE proy_id = ?;",
                "DELETE FROM project WHERE id = ?;",
            ];
            const result = await Promise.all(deleteSql.map(sql => db.execute({
                sql,
                args: [id.id],
            })));
            return result.map(r => r.rowsAffected).reduce((a, b) => a + b) > 0;
        } catch(e: any) {
            throwError(e, "Invalid token");
            throw new Error("Error deleting project");
        }
    },
}