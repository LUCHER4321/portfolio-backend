import { categoryController } from "../controllers/categories";
import { languageController } from "../controllers/languages";
import { projectController } from "../controllers/projects";
import { getTranslationsController } from "../controllers/translations";
import { getUserController } from "../controllers/user";
import { categoryModel } from "../models/categories";
import { languageModel } from "../models/languages";
import { projectModel } from "../models/projects";
import { getTranslations } from "../models/translations";
import { getUser } from "../models/user";
import { createAPI } from "../routes/api-portfolio";
import { createApp } from "./app";

export const app = createApp({
    api: createAPI({
        languageController: languageController(languageModel),
        categoryController: categoryController(categoryModel),
        projectController: projectController(projectModel),
        getTranslationsController: getTranslationsController(getTranslations),
        getUserController: getUserController(getUser),
    }),
});