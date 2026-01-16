import axios from "axios";

class GDrive {
    constructor() {
        // API Key eka
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                params: {
                    key: this.k,
                    fields: "id,name,mimeType,size"
                }
            });

            // Oyaata onima karana direct usercontent link format eka
            // Mehi uuid eka random hadana ekak nisa, samanya download ekakata id saha confirm thibunaama athi.
            const directDownload = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: m.name,
                    fileSize: m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
                    mimetype: m.mimeType,
                    downloadUrl: directDownload 
                }
            };
        } catch (e) {
            throw new Error(e.response?.data?.error?.message || e.message);
        }
    }

    extractId(u) {
        const r = u.match(/[-\w]{25,}/);
        return r ? r[0] : null;
    }
}

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL required" });

    try {
        const gdrive = new GDrive();
        const response = await gdrive.getDetails(url);
        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
