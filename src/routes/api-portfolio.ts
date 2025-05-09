import { Request, Response, Router } from "express";
import { Controller } from "../types"
import { createRouter } from "./route";

interface APIProps {
    languageController: Controller;
    categoryController: Controller;
    projectController: Controller;
    getTranslationsController: (res: Response) => Promise<void>;
    getUserController: (req: Request, res: Response) => Promise<void>;
}

export const createAPI = ({
    languageController,
    categoryController,
    projectController,
    getTranslationsController,
    getUserController,
}: APIProps) => {
    const router = Router();
    router.get("/", (_, res) => {
        res.json({ message: "Welcome to this API" });
    });
    router.get("/translations", async (_, res) => {
        await getTranslationsController(res);
    });
    router.get("/user/:token", getUserController);
    router.use("/languages", createRouter({ controller: languageController }));
    router.use("/categories", createRouter({ controller: categoryController }));
    router.use("/projects", createRouter({ controller: projectController, previous: "/:user" }));
    return router;
};