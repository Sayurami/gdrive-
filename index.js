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
            
            // පියවර 1: මුලින්ම Cookie එක ලබාගැනීමට Request එකක් යවනවා
            const firstRes = await axios.get(base, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const cookie = firstRes.headers['set-cookie'];

            // පියවර 2: ඒ Cookie එක පාවිච්චි කරලා uuid එක සහිත Redirect ලින්ක් එක අල්ලගන්නවා
            let finalDownloadUrl = `${base}&confirm=t`;
            try {
                const finalRes = await axios.get(`${base}&confirm=t`, {
                    headers: {
                        'Cookie': cookie ? cookie.join('; ') : '',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': base
                    },
                    maxRedirects: 0,
                    validateStatus: (status) => status >= 200 && status < 400
                });
                
                if (finalRes.headers.location) {
                    finalDownloadUrl = finalRes.headers.location;
                }
            } catch (err) {
                // Axios 302 Found error එකක් විදියට දෙන නිසා catch එකේදීත් location එක බලනවා.
                if (err.response && err.response.headers && err.response.headers.location) {
                    finalDownloadUrl = err.response.headers.location;
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
                    downloadUrl: finalDownloadUrl // මෙතනට දැන් uuid/at සහිත ලින්ක් එක එනවා
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
