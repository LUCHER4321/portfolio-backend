import { Router } from "express";
import { Controller } from "../types"

interface routerProps {
    controller: Controller;
    previous?: string;
}

export const createRouter = ({ controller, previous }: routerProps) => {
    const router = Router();
    router.get(previous + "/", controller.getAll);
    router.get(previous + "/:id", controller.getById);
    router.post(previous + "/", controller.create);
    router.patch(previous + "/:id", controller.update);
    router.delete(previous + "/:id", controller.delete);
    router.options(previous + "/", (_, res) => {
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
        res.send(200);
    });
    return router;
};