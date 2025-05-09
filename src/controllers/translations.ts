import { Response } from "express";

export const getTranslationsController = (getTranslations: () => Promise<string[]>) => async (res: Response) => {
    try {
        const translations = await getTranslations();
        res.json(translations);
    } catch(e: any) {
        res.status(404).json({ message: e.message });
    }
};