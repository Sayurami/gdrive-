import axios from "axios";

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. ගොනුවේ විස්තර ලබාගැනීම
            let details = { name: "File", size: "N/A", mime: "application/octet-stream" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                details.name = m.name;
                details.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                details.mime = m.mimeType;
            } catch (e) {}

            // 2. uuid එක සහ confirm token එක සහිත Fresh ලින්ක් එක ලබාගැනීම
            const base = `https://drive.google.com/uc?export=download&id=${id}`;
            
            // මුලින්ම cookie එක ලබාගැනීමට request එකක් යවනවා
            const firstRes = await fetch(base, { method: 'GET' });
            const cookie = firstRes.headers.get('set-cookie');

            // දැන් එම cookie එක පාවිච්චි කරලා uuid ලින්ක් එක අල්ලගන්නවා
            const finalRes = await fetch(`${base}&confirm=t`, {
                method: 'GET',
                redirect: 'manual',
                headers: {
                    'cookie': cookie || '',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const finalDownloadUrl = finalRes.headers.get('location') || `${base}&confirm=t`;

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: details.name,
                    fileSize: details.size,
                    mimetype: details.mime,
                    downloadUrl: finalDownloadUrl // දැන් මෙතනට uuid සහ confirm=t සහිත ලින්ක් එක ලැබෙයි
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
