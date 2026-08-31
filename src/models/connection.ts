import { createClient } from "@libsql/client";
import { CMB_API_KEY, MAILER_PASS, MAILER_USER, PHONE, TOKEN, URL } from "../config";
import { createTransport } from "nodemailer";

export const db = createClient({
    url: URL,
    authToken: TOKEN,
});

export const transporter = createTransport({
    service: "Gmail",
    auth: {
        user: MAILER_USER,
        pass: MAILER_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify()
    .then(() => console.log("Ready for send emails"))
    .catch(e => {
        console.error("Error configuring email:", (e as Error).message);
        console.error("Details:", e);
    });

export const sendWhatsApp = (message: string) => `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(message)}&apikey=${CMB_API_KEY}`;