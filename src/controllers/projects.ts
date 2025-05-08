import { Controller, ProjectModel } from "../types";
import { parseCategoryId, toNewPartialProject, toNewProject } from "../utils";

export const projectController = (model: ProjectModel): Controller => ({
    model,
    getAll: async (req, res) => {
        const { user } = req.params;
        const { cat, lan } = req.query;
        try {
            const catId = parseCategoryId(cat?.toString() ?? "");
            const projects = await model.getAll({ user, cat: catId, lan: lan?.toString() });
            res.json(projects);
        } catch(e: any) {
            res.status(404).json({ message: e.message });
        }
    },
    getById: async (req, res) => {
        const { user, id } = req.params;
        try {
            const project = await model.getById({ id: { id: +id, user } });
            res.json(project);
        } catch(e: any){
            res.status(404).json({ message: e.message });
        }
    },
    create: async (req, res) => {
        const { user } = req.params;
        try {
            const newProject = toNewProject(req.body);
            const project = await model.create({ user, input: newProject });
            res.json(project);
        } catch(e: any){
            res.status(400).json({ message: e.message });
        }
    },
    update: async (req, res) => {
        const { user, id } = req.params;
        try {
            const newProject = toNewPartialProject(req.body);
            const project = await model.update({ id: { id: +id, user }, input: newProject });
            res.json(project);
        } catch(e: any){
            res.status(400).json({ message: e.message });
        }
    },
    delete: async (req, res) => {
        const { user, id } = req.params;
        const { token } = req.body;
        try {
            const deleted = await model.delete({ id: { id: +id, user }, token });
            if(!deleted) return res.status(400).json({ message: "Project not found" });
        } catch(e: any){
            res.status(400).json({ message: e.message });
        }
        res.json({ message: "Project deleted successfully" });
    },
});