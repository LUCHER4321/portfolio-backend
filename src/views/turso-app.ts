import { categoryController } from "../controllers/categories";
import { languageController } from "../controllers/languages";
import { projectController } from "../controllers/projects";
import { categoryModel } from "../models/categories";
import { languageModel } from "../models/languages";
import { projectModel } from "../models/projects";
import { createAPI } from "../routes/api-portfolio";
import { createApp } from "./app";

export const app = createApp({
    api: createAPI({
        languageController: languageController(languageModel),
        categoryController: categoryController(categoryModel),
        projectController: projectController(projectModel),
    }),
});