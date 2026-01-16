import axios from "axios";

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. File Details (Name/Size)
            let details = { name: "File", size: "N/A", mime: "application/octet-stream" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                details.name = m.name;
                details.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                details.mime = m.mimeType;
            } catch (e) {}

            // 2. Getting the RAW Redirect Link (Fresh UserContent with UUID)
            // අපි confirm=t පාවිච්චි කරලා raw ලින්ක් එක ඉල්ලනවා
            const base = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
            
            let finalDownloadUrl = base;

            try {
                // Axios වෙනුවට මෙතනට native 'fetch' පාවිච්චි කරනවා redirect එක හරියටම අල්ලන්න
                const res = await fetch(base, {
                    method: 'GET',
                    redirect: 'manual', // මේකෙන් තමයි redirect එක නවත්තලා ලින්ක් එක අල්ලන්නේ
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                // Google එකෙන් එවන සම්පූර්ණ fresh ලින්ක් එක (uuid සහිතව) මෙතන තියෙනවා
                const location = res.headers.get('location');
                if (location) {
                    finalDownloadUrl = location;
                }
            } catch (err) {
                console.log("Redirect capture failed");
            }

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: details.name,
                    fileSize: details.size,
                    mimetype: details.mime,
                    downloadUrl: finalDownloadUrl // දැන් මෙතනට අර දිග uuid ලින්ක් එක එනවා
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
