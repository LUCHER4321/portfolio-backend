import { CategoryModel, Controller } from "../types";
import { parseCategoryId, toNewCategory, toNewPartialCategory } from "../utils";

export const categoryController = (model: CategoryModel): Controller => ({
    model,
    getAll: async (req, res) => {
        const { proy, user } = req.query;
        const numProy = Number(proy);
        const cleanId = typeof user === 'string' ? user : undefined;
        try {
            const categories = await model.getAll({ proy: isNaN(numProy) ? undefined : numProy, user: cleanId });
            res.json(categories);
        } catch(e: any){
            res.status(404).json({ message: e.message });
        }
    },
    getById: async (req, res) => {
        const { id } = req.params;
        try{
            const category = await model.getById({ id: parseCategoryId(id) });
            res.json(category);
        } catch(e: any){
            res.status(404).json({ message: e.message });
        }
    },
    create: async (req, res) => {
        try {
            const newCategory = toNewCategory(req.body);
            const category = await model.create({ input: newCategory });
            res.json(category);
        } catch(e: any){
            res.status(400).json({ message: e.message });
        }
    },
    update: async (req, res) => {
        const { id } = req.params;
        try {
            const newCategory = toNewPartialCategory(req.body);
            const category = await model.update({ id: parseCategoryId(id), input: newCategory });
            res.json(category);
        } catch(e: any){
            res.status(400).json({ message: e.message });
        }
    },
    delete: async (req, res) => {
        const { id } = req.params;
        const { token } = req.body;
        try{
            const deleted = await model.delete({ id: parseCategoryId(id), token });
            if(!deleted) return res.status(400).json({ message: "Category not found" });
        }
        catch(e: any){
            res.status(400).json({ message: e.message });
        }
        res.json({ message: "Category deleted successfully" });
    },
});