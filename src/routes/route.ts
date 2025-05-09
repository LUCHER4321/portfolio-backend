import { Router } from "express";
import { Controller } from "../types"

interface routerProps {
    controller: Controller;
    previous?: string;
}

export const createRouter = ({ controller, previous }: routerProps) => {
    const prevString = previous ?? "";
    const router = Router();
    router.get(prevString + "/", controller.getAll);
    router.get(prevString + "/:id", controller.getById);
    router.post(prevString + "/", controller.create);
    router.patch(prevString + "/:id", controller.update);
    router.delete(prevString + "/:id", controller.delete);
    router.options(prevString + "/", (_, res) => {
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
        res.send(200);
    });
    return router;
};