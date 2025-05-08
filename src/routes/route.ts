import { Router } from "express";
import { Controller } from "../types"

export const createRouter = ({ controller }: { controller: Controller }) => {
    const router = Router();
    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.patch("/:id", controller.update);
    router.delete("/:id", controller.delete);
    router.options("/", (_, res) => {
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
        res.send(200);
    });
    return router;
};