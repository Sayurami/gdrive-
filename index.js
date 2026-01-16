import axios from "axios";

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. File Details ලබාගැනීම
            let info = { name: "File", size: "N/A", mime: "video/mp4" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                info.name = m.name;
                info.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                info.mime = m.mimeType;
            } catch (e) {}

            // 2. Fresh UUID සහිත ලින්ක් එක ලබාගැනීම
            const base = `https://drive.google.com/uc?export=download&id=${id}`;
            
            // පළමු පියවර: Cookie එක ලබාගැනීම
            const firstResponse = await fetch(base);
            const cookie = firstResponse.headers.get('set-cookie');

            // දෙවන පියවර: Cookie එක පාවිච්චි කරලා uuid එක සහිත redirect ලින්ක් එක අල්ලගැනීම
            const finalResponse = await fetch(`${base}&confirm=t`, {
                method: 'GET',
                redirect: 'manual',
                headers: {
                    'cookie': cookie || '',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // Google එකෙන් redirect කරන සම්පූර්ණ ලින්ක් එක (uuid සහිත එක) මෙතන තියෙනවා
            const finalDownloadUrl = finalResponse.headers.get('location') || `${base}&confirm=t`;

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: info.name,
                    fileSize: info.size,
                    mimetype: info.mime,
                    downloadUrl: finalDownloadUrl 
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
