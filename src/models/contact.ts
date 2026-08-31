import { MAIL, MAILER_USER } from "../config";
import { ContactModel } from "../types";
import { sendWhatsApp, transporter } from "./connection";
import { validateToken } from "./token";

export const contactModel: ContactModel = {
    contact: async ({ token, name, company, email, phone, message }) => {
        const validation = await validateToken(token);
        if (!validation) throw new Error("Invalid token");
        await transporter.sendMail({
            from: `"No Reply" <${MAILER_USER}>`,
            to: MAIL,
            subject: `Contact mail from ${name} (${email})`,
            text: `Company: ${company}
Phone: ${phone}
${message}`
        });
        await fetch(sendWhatsApp(`*Name*: ${name}
*Email*: ${email}
*Company*: ${company}
*Phone*: ${phone}
${message}
        `));
    }
}