import { Request, Response } from "express";

type Letter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type CategoryId = `${Letter}${Letter}${Digit}${Digit}`;

export interface Name {
    translation: string;
    name: string;
}

export interface Language {
    id: number;
    name: string;
    image: string;
}

export interface Category {
    id: CategoryId;
    icon: string;
    name: Name[];
}

export interface Project {
    id: number;
    name: Name[];
    repository: string;
    website?: string;
    icon?: string;
    languages: Language[];
    categories: Category[];
}

export type ToPost<T> = { token: string } & Omit<T, "id">;

export type ToPatch<T> = { token: string } & Partial<Omit<ToPost<T>, "token">>;

interface UpdateProps<T, ID> {
    id: ID;
    input: ToPatch<T>;
}

interface DeleteProps<ID> {
    id: ID;
    token: string;
}

interface Model<T, ID> {
    getAll: () => Promise<T[]>
    getById: ({id}: {id: ID}) => Promise<T>;
    create: ({input}: {input: ToPost<T>}) => Promise<T>;
    update: ({id, input}: UpdateProps<T, ID>) => Promise<T>;
    delete: ({id, token}: DeleteProps<ID>) => Promise<boolean>;
}

interface GetAllProps {
    proy?: number;
    user?: string;
}

interface PropModel<T, ID> extends Model<T, ID> {
    getAll: ({proy, user}: GetAllProps) => Promise<T[]>;
}

interface GetAllProject {
    user: string;
    cat?: CategoryId;
    lan?: string;
}

interface ProjectId {
    user: string;
    id: number;
}

export interface ProjectModel extends Model<Project, ProjectId> {
    getAll: ({cat, lan}: GetAllProject) => Promise<Project[]>;
    create: ({user, input}: {user: string, input: ToPost<Project>}) => Promise<Project>;
}

export type LanguageModel = PropModel<Language, number>;

export interface CategoryModel extends PropModel<Category, CategoryId> {
    create: ({input}: {input: { token: string } & Category}) => Promise<T>;
}

export interface Controller {
    model: Model;
    getAll: (req: Request, res: Response) => Promise;
    getById: (req: Request, res: Response) => Promise;
    create: (req: Request, res: Response) => Promise;
    update: (req: Request, res: Response) => Promise;
    delete: (req: Request, res: Response) => Promise;
}