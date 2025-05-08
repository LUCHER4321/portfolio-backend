import { Response } from "express";
import { getTranslations } from "../models/translations";

export const getTranslationsController = async (res: Response) => {
    try {
        const translations = await getTranslations();
        res.json(translations);
    } catch(e: any) {
        res.status(404).json({ message: e.message });
    }
};