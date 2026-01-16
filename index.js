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
            let details = { name: "File", size: "N/A", mime: "video/mp4" };
            try {
                const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                    params: { key: this.k, fields: "name,mimeType,size" }
                });
                details.name = m.name;
                details.size = m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A";
                details.mime = m.mimeType;
            } catch (e) {}

            // 2. Fresh UUID එක සහිත ලින්ක් එක බලෙන්ම අල්ලගැනීම
            const base = `https://drive.google.com/uc?export=download&id=${id}`;
            
            // මුලින්ම Google එකට ගිහින් Cookie එක අරගන්නවා
            const firstRes = await axios.get(base, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const cookie = firstRes.headers['set-cookie'];

            // දැන් ඒ Cookie එක පාවිච්චි කරලා uuid සහිත ලින්ක් එකට Redirect වෙන එක අල්ලනවා
            let finalLink = `${base}&confirm=t`;
            try {
                const finalRes = await axios.get(`${base}&confirm=t`, {
                    headers: {
                        'Cookie': cookie ? cookie.join('; ') : '',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': base
                    },
                    maxRedirects: 0, // Redirect එක නවත්වලා ලින්ක් එක විතරක් ගන්නවා
                    validateStatus: (status) => status >= 200 && status < 400
                });
                
                if (finalRes.headers.location) {
                    finalLink = finalRes.headers.location;
                }
            } catch (err) {
                // Axios 302 එකක් ආවොත් location එක මෙතන තියෙනවා
                if (err.response && err.response.headers.location) {
                    finalLink = err.response.headers.location;
                }
            }

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: details.name,
                    fileSize: details.size,
                    mimetype: details.mime,
                    downloadUrl: finalLink 
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
