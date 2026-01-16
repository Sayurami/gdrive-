import axios from "axios";

class GDrive {
    constructor() {
        // API Key (විස්තර ලබාගැනීමට පමණි)
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // 1. මුලින්ම ගොනුවේ නම සහ විස්තර ලබාගන්නවා
            const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                params: {
                    key: this.k,
                    fields: "id,name,mimeType,size"
                }
            });

            // 2. Fresh UserContent Link එක ලබාගැනීම (Redirect follow කරලා)
            const baseLink = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;
            
            // අපි Axios වලට කියනවා redirect වෙන්න එපා, ඒ වෙනුවට redirect වෙන ලින්ක් එක අපිට දෙන්න කියලා
            const res = await axios.get(baseLink, {
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400
            });

            const freshLink = res.headers.location || baseLink;

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: m.name,
                    fileSize: m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
                    mimetype: m.mimeType,
                    downloadUrl: freshLink // මෙන්න ඔයා ඉල්ලපු fresh ලින්ක් එක
                }
            };
        } catch (e) {
            // Redirect එක error එකක් විදියට ආවොත් එතනිනුත් ලින්ක් එක ගන්නවා
            if (e.response && e.response.headers.location) {
                return {
                    creator: "Hansa Dewmina",
                    status: 200,
                    success: true,
                    result: {
                        downloadUrl: e.response.headers.location
                    }
                };
            }
            throw new Error(e.message);
        }
    }

    extractId(u) {
        const r = u.match(/[-\w]{25,}/);
        return r ? r[0] : null;
    }
}

// මේ කොටස තමයි Vercel එකට වැදගත්ම (Exporting the Handler)
export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ 
            success: false, 
            message: "කරුණාකර 'url' පරාමිතිය (parameter) ලබා දෙන්න." 
        });
    }

    try {
        const gdrive = new GDrive();
        const response = await gdrive.getDetails(url);
        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
}
