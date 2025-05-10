import serverless from "serverless-http";
import { app } from "../build/views/turso-app.js";

export const handler = serverless(app);