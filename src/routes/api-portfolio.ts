import { Router } from "express";
import { Controller } from "../types"
import { createRouter } from "./route";
import { getTranslationsController } from "../controllers/translations";
import { getUserController } from "../controllers/user";

interface APIProps {
    languageController: Controller;
    categoryController: Controller;
    projectController: Controller;
}

export const createAPI = ({
    languageController,
    categoryController,
    projectController
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