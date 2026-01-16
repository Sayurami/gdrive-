import axios from "axios";

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. ගොනුවේ නම සහ විස්තර ලබාගැනීම
            let info = { name: "File", size: "N/A", mime: "application/octet-stream" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                info.name = m.name;
                info.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                info.mime = m.mimeType;
            } catch (e) {}

            // 2. Fresh UserContent Link එක අල්ලගැනීම (The Hard Way)
            const downloadPageUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
            
            let finalLink = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;

            try {
                const res = await axios.get(downloadPageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    },
                    maxRedirects: 0, // මෙතනින් තමයි redirect එක නවත්වන්නේ
                    validateStatus: (status) => status >= 200 && status < 400
                });

                if (res.headers.location) {
                    finalLink = res.headers.location;
                }
            } catch (err) {
                // Axios 302 එකක් ආවොත් ඒක error එකක් විදියට පෙන්වනවා, එතනිනුත් ලින්ක් එක ගන්නවා
                if (err.response && err.response.headers.location) {
                    finalLink = err.response.headers.location;
                }
            }

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: info.name,
                    fileSize: info.size,
                    mimetype: info.mime,
                    downloadUrl: finalLink // දැන් මෙතනට ඔයා ඉල්ලන දිග ලින්ක් එක එයි
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
