import axios from "axios";

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. ගොනුවේ නම සහ ප්‍රමාණය ලබා ගැනීම
            let details = { name: "File", size: "N/A", mime: "application/octet-stream" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                details.name = m.name;
                details.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                details.mime = m.mimeType;
            } catch (e) {}

            // 2. Fresh Direct Download Link එක Capture කිරීම
            // 'confirm=t' සමඟ request එක යැවූ විට Google විසින් uuid සහිත සම්පූර්ණ ලින්ක් එකකට අපව redirect කරයි.
            const base = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
            
            let finalDownloadUrl = base;

            // අපි fetch පාවිච්චි කරලා redirect එක manual කරනවා, එවිට අපිට සම්පූර්ණ ලින්ක් එක අල්ලගන්න පුළුවන්.
            const res = await fetch(base, {
                method: 'GET',
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // Google එකෙන් ලැබෙන fresh redirect ලින්ක් එක (uuid සහිත එක)
            const location = res.headers.get('location');
            if (location) {
                finalDownloadUrl = location;
            }

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: details.name,
                    fileSize: details.size,
                    mimetype: details.mime,
                    downloadUrl: finalDownloadUrl // මෙතනට දැන් ඔයා ඉල්ලපු uuid සහිත ලින්ක් එක එනවා
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
