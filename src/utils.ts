import { WEBHOOK } from "./config";
import { Category, CategoryId, Language, Project, ProjectModel, ToPatch, ToPost } from "./types";

const isString = (str: any): boolean => (typeof str === "string" || str instanceof String);

const isURL = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const parseString = (str: any, prop: string): string => {
    if(!isString(str)) throw new Error(`Incorrect or missing ${prop}`);
    return str;
};

const parseURL = (url: any, prop: string): string => {
    if(!isString(url) || !isURL(url)) throw new Error(`Incorrect or missing ${prop}`);
    return url;
};

const toPartial = <T,>(object: () => T): (T | undefined) => {
    try {
        return object();
    } catch {
        return undefined;
    }
}

export const parseCategoryId = (str: string) => {
    const validate = /^[a-z]{2}\d{2}$/.test(str);
    if(validate) return str as CategoryId;
    throw new Error("Invalid category id");
};

const parseList = (object: any, prop: string): any[] => {
    if(!Array.isArray(object)) throw new Error(`Incorrect or missing ${prop}`);
    return object;
}

export const toNewLanguage = (object: any): ToPost<Language> => ({
    token: parseString(object.token, "token"),
    name: parseString(object.name, "name"),
    image: parseURL(object.image, "image"),
});

export const toNewPartialLanguage = (object: any): ToPatch<Language> => ({
    token: parseString(object.token, "token"),
    name: toPartial(() => parseString(object.name, "name")),
    image: toPartial(() => parseURL(object.image, "image")),
});

export const toNewCategory = (object: any): { token: string } & Category => ({
    token: parseString(object.token, "token"),
    id: parseCategoryId(object.id),
    icon: parseURL(object.icon, "icon"),
    name: parseList(object.name, "name").map(n => ({
        translation: parseString(n.translation, "translation"),
        name: parseString(n.name, "name"),
    })),
});

export const toNewPartialCategory = (object: any): ToPatch<Category> => ({
    token: parseString(object.token, "token"),
    icon: toPartial(() => parseURL(object.icon, "icon")),
    name: toPartial(() => parseList(object.name, "name").map(n => ({
        translation: parseString(n.translation, "translation"),
        name: parseString(n.name, "name"),
    }))),
});

export const toNewProject = (object: any): ToPost<Project> => ({
    token: parseString(object.token, "token"),
    name: parseList(object.name, "name").map(n => ({
        translation: parseString(n.translation, "translation"),
        name: parseString(n.name, "name"),
        description: toPartial(() => parseString(n.description, "description")),
    })),
    repository: parseURL(object.repository, "repository"),
    website: toPartial(() => parseURL(object.website, "website")),
    icon: toPartial(() => parseURL(object.icon, "icon")),
    languages: parseList(object.languages, "languages").map(l => ({
        id: 0,
        name: parseString(l, "language"),
        image: "",
    })),
    categories: parseList(object.categories, "categories").map(c => ({
        id: parseCategoryId(c),
        name: [],
        icon: ""
    })),
});

export const toNewPartialProject = (object: any): ToPatch<Project> => ({
    token: parseString(object.token, "token"),
    name: toPartial(() => parseList(object.name, "name").map(n => ({
        translation: parseString(n.translation, "translation"),
        name: parseString(n.name, "name"),
        description: toPartial(() => parseString(n.description, "description")),
    }))),
    repository: toPartial(() => parseURL(object.repository, "repository")),
    website: toPartial(() => parseURL(object.website, "website")),
    icon: toPartial(() => parseURL(object.icon, "icon")),
    languages: toPartial(() => parseList(object.languages, "languages").map(l => ({
        id: 0,
        name: l,
        image: "",
    }))),
    categories: toPartial(() => parseList(object.categories, "categories").map(c => ({
        id: c,
        name: [],
        icon: ""
    }))),
});

export const updateWebhook = async (user: string, model: ProjectModel) => {
    const allProjects = await model.getAll({ user });
    await fetch(WEBHOOK, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ projects: allProjects })
    }).catch(e => console.error("Failed to update webhook", e));
};

export const toContact = (object: any) => ({
    token: parseString(object.token, "token"),
    name: toPartial(() => parseString(object.name, "name")),
    company: toPartial(() => parseString(object.company, "company")),
    email: toPartial(() => parseString(object.email, "email")),
    phone: toPartial(() => parseString(object.phone, "phone")),
    message: toPartial(() => parseString(object.message, "message")),
});