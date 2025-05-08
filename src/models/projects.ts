import { Row } from "@libsql/client";
import { Name, Project, ProjectModel } from "../types";
import { categoryModel } from "./categories";
import { db } from "./connection";
import { languageModel } from "./languages";
import { validateToken } from "./token";

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
    icon: row.website ?? undefined,
    languages: await getLanguages(row.id as number),
    categories: await getCategories(row.id as number),
} as Project);

const toProjects = async (rows: Row[]) => await Promise.all(rows.map(async r => await toProject(r)));

export const projectModel: ProjectModel = {
    getAll: async ({ user, cat, lan }) => {
        if(cat && lan) {
            const result = (await db.execute({
                sql: "SELECT project.id AS id, repository, website, icon FROM project, lan_proy, language, cat_proy WHERE hex(user_id) = ? AND project.id = lan_proy.proy_id AND lan_id = language.id AND name = ? AND project.id = cat_proy.proy_id AND cat_id = ? GROUP BY project.id;",
                args: [user, lan, cat],
            })).rows;
            return await toProjects(result);
        }
        if(cat) {
            const result = (await db.execute({
                sql: "SELECT id, repository, website, icon FROM project, cat_proy WHERE hex(user_id) = ? AND id = proy_id AND cat_id = ? GROUP BY id;",
                args: [user, cat],
            })).rows;
            return await toProjects(result);
        }
        if(lan) {
            const result = (await db.execute({
                sql: "SELECT project.id AS id, repository, website, icon FROM project, lan_proy, language WHERE hex(user_id) = ? AND project.id = proy_id AND lan_id = language.id AND name = ? GROUP BY project.id;",
                args: [user, lan],
            })).rows;
            return await toProjects(result);
        }
        const result = (await db.execute({
            sql: "SELECT id, repository, website, icon FROM project WHERE hex(user_id) = ?;",
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
             sql: "SELECT id, repository, website, icon FROM project WHERE hex(user_id) = ? AND id = ?;",
             args: [user, proy],
         })).rows;
         if(!result) throw new Error("No languages with that id made by that user");
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
                sql: "INSERT INTO project (repository, website, icon, user_id) VALUES (?, ?, ?, (SELECT id FROM user WHERE hex(id) = ?)) RETURNING (id, repository, website, icon);",
                args: [repository, website ?? null, icon ?? null, user],
            })).rows;
            const forSql = name.map(() => "(?, (SELECT id FROM translation WHERE name = ?), ?)");
            const forArgs = name.flatMap(n => [n.name, n.translation, result.id]);
            const resultName = (await db.execute({
                sql: `INSERT INTO proy_name (name, tran_id, proy_id) VALUES ${forSql.join(", ")} RETURNING (proy_name.name as name, (SELECT translation.name FROM translation WHERE translation.id = tran_id) as translation);`,
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
        } catch {
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
                sql: `UPDATE project SET ${fields.join(", ")} WHERE id = ? RETURNING *;`,
                args,
            })).rows;
            if(name) {
                const forSql = [
                    name.map(() => "?"),
                    name.map(() => "WHEN ? THEN ?"),
                ];
                const forArgs = [
                    name.map(n => n.translation),
                    name.flatMap(n => [n.translation, n.name]),
                ];
                const sql = `DELETE FROM proy_name WHERE proy_id = ? AND tran_id NOT IN (SELECT id FROM translation WHERE translation.name IN (${forSql[0].join(", ")}));
                UPDATE proy_name SET proy_name.name = CASE translation.name ${forSql[1].join(" ")} END FROM translation WHERE AND tran_id = translation.id AND proy_id = ? AND translation.name IN (${forSql[0].join(", ")});
                INSERT INTO proy_name (name, tran_id, proy_id) SELECT CASE translation.name ${forSql[1].join(" ")} END, translation.id, ? FROM translation LEFT JOIN proy_name ON tran_id = translation.id AND proy_id = ? WHERE translation.name IN (${forSql[0].join(", ")}) AND tran_id IS NULL;`;
                const args = [
                    id.id,
                    ...forArgs[0],
                    ...forArgs[1],
                    id.id,
                    ...forArgs[1],
                    id.id,
                    id.id,
                    ...forArgs[0],
                ];
                await db.execute({
                    sql,
                    args,
                });
            }
            if(languages) {
                const forSql = [
                    languages.map(() => "?"),
                ];
                const forArgs = [
                    languages.map(l => l.name),
                ];
                const sql = `DELETE FROM lan_proy WHERE proy_id = ? AND lan_id NOT IN (SELECT id FROM language WHERE name IN (${forSql[0].join(", ")}));
                INSERT INTO lan_proy (lan_id, proy_id) SELECT id, ? FROM language WHERE name IN (${forSql[0].join(", ")}) AND id NOT IN (SELECT lan_id FROM lan_proy WHERE proy_id = ?);`;
                const args = [
                    id.id,
                    ...forArgs[0],
                    id.id,
                    ...forArgs[0],
                    id.id,
                ];
                await db.execute({
                    sql,
                    args,
                });
            }
            if(categories) {
                const forSql = [
                    categories.map(() => "?"),
                ];
                const forArgs = [
                    categories.map(c => c.id),
                ];
                const sql = `DELETE FROM cat_proy WHERE proy_id = ? AND cat_id NOT IN (${forSql[0].join(", ")});
                INSERT INTO cat_proy (cat_id, proy_id) SELECT id, ? FROM category WHERE id IN (${forSql[0].join(", ")}) AND id NOT IN (SELECT cat_id FROM cat_proy WHERE proy_id = ?);`;
                const args = [
                    id.id,
                    ...forArgs[0],
                    id.id,
                    ...forArgs[0],
                    id.id,
                ];
                await db.execute({
                    sql,
                    args,
                });
            }
            return await toProject(result);
         } catch {
            throw new Error("Error updating project");
         }
    },
    delete: async ({ id, token }) => {
        try {
            const validation = await validateToken(token);
            if(!validation) throw new Error("Invalid token");
            const result = await db.execute({
                sql: `DELETE FROM proy_name WHERE proy_id = ?;
                DELETE FROM cat_proy WHERE proy_id = ?;
                DELETE FROM lan_proy WHERE proy_id = ?;
                DELETE FROM project WHERE id = ?;`,
                args: [id.id, id.id, id.id, id.id],
            });
            return result.rowsAffected > 0;
        } catch {
            throw new Error("Error deleting project");
        }
    },
}