import { Request, Response } from "express";
import { getUser } from "../models/user";

export const getUserController = async (req: Request, res: Response) => {
    const { token } = req.params;
    try {
        const user = await getUser({ token });
        res.json(user);
    } catch(e: any) {
        res.status(404).json({ message: e.message });
    }
};