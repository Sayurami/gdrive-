import axios from "axios";
import https from "https";

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. File Details (Name/Size)
            let details = { name: "File", size: "N/A", mime: "video/mp4" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                details.name = m.name;
                details.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                details.mime = m.mimeType;
            } catch (e) {}

            // 2. Fresh Direct Link එක uuid සහිතව ලබාගැනීම
            const baseLink = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
            
            const getFreshLink = () => {
                return new Promise((resolve) => {
                    https.get(baseLink, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    }, (res) => {
                        // Google එකෙන් redirect කරන අලුත්ම uuid සහිත ලින්ක් එක location header එකේ එනවා
                        const fresh = res.headers.location || baseLink;
                        resolve(fresh);
                    }).on('error', () => resolve(baseLink));
                });
            };

            const downloadUrl = await getFreshLink();

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: details.name,
                    fileSize: details.size,
                    mimetype: details.mime,
                    downloadUrl: downloadUrl // දැන් මෙතනට ඔයා ඉල්ලන දිග ලින්ක් එක එයි
                }
            };
        } catch (e) {
            throw new Error(e.message);
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
