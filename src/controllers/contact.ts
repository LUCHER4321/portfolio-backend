import { ContactController, ContactModel } from "../types";
import { toContact } from "../utils";

export const contactController = ({
    contactModel
}: { contactModel: ContactModel }): ContactController => ({
    contact: async (req, res) => {
        try {
            const newContact = toContact(req.body);
            await contactModel.contact(newContact);
            res.json({ message: "Message sent successfully" });
        } catch (e) {
            res.status(400).json({ error: (e as Error).message });
        }
    }
})