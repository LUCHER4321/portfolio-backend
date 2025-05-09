import express, { json, Router } from "express";
import { corsMw } from "../middlewares/cors";

export const createApp = ({ api }: { api: Router }) => {
    const app = express();
    app.disable("x-powered-by");
    app.use(json());
    app.use(corsMw());
    app.use("/api/portfolio", api);
    return app;
};