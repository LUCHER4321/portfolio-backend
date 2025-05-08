import { Controller, LanguageModel } from "../types";
import { toNewLanguage, toNewPartialLanguage } from "../utils";

export const languageController = (model: LanguageModel): Controller => ({
    model,
    getAll: async (req, res) => {
        const { proy, user } = req.query;
        const numProy = Number(proy);
        const cleanId = typeof user === 'string' ? user : undefined;
        try {
            const languages = await model.getAll({ proy: isNaN(numProy) ? undefined : numProy, user: cleanId });
            res.json(languages);
        } catch(e: any){
            res.status(404).json({ message: e.message });
        }
    },
    getById: async (req, res) => {
        const { id } = req.params;
        try{
            const language = await model.getById({ id: +id });
            res.json(language);
        } catch(e: any){
            res.status(404).json({ message: e.message });
        }
    },
    create: async (req, res) => {
        try {
            const newLanguage = toNewLanguage(req.body);
            const language = await model.create({ input: newLanguage });
            res.json(language);
        } catch(e: any) {
            res.status(400).json({ message: e.message });
        }
    },
    update: async (req, res) => {
        try {
            const newLanguage = toNewPartialLanguage(req.body);
            const { id } = req.params;
            const language = await model.update({ id: +id, input: newLanguage });
            res.json(language);
        } catch(e: any) {
            res.status(400).json({ message: e.message });
        }
    },
    delete: async (req, res) => {
        const { id } = req.params;
        const { token } = req.body;
        try{
            const deleted = await model.delete({ id: +id, token });
            if(!deleted) return res.status(400).json({ message: "Language not found" });
        } catch(e: any) {
            res.status(400).json({ message: e.message });
        }
        res.json({ message: "Language deleted successfully" });
    },
});