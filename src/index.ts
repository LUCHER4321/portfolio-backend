import { VercelRequest, VercelResponse } from "@vercel/node";
import { PORT, VERCEL } from "./config";
import { app } from "./views/turso-app";

export default (req: VercelRequest, res: VercelResponse) => app(req, res);

if(VERCEL !== "1") {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}