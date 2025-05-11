import { PORT } from "./config";
import { app } from "./views/turso-app";

module.exports = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});