import { Request, Response } from "express";

export const notFound = (_: Request, res: Response) => {
    res.status(404).end();
};