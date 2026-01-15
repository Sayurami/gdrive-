import axios from "axios";

class GDrive {
    constructor() {
        // Google Drive API Key 
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid Google Drive URL or ID.");

            // Google Drive API හරහා ගොනුවේ විස්තර ලබා ගැනීම
            const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                params: {
                    key: this.k,
                    fields: "id,name,mimeType,size,webContentLink,owners,createdTime"
                }
            });

            // විශාල ගොනු සඳහා virus warning එක මඟහැර කෙලින්ම ඩවුන්ලෝඩ් වන Direct Link එක
            // confirm=t මගින් විශාල ගොනු වල warning එක bypass කරයි
            const directDownload = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;

            return {
                status: true,
                type: m.mimeType === "application/vnd.google-apps.folder" ? "folder" : "file",
                details: {
                    id: m.id,
                    name: m.name,
                    size: m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
                    mimeType: m.mimeType,
                    owner: m.owners ? m.owners[0].displayName : "Unknown",
                    createdTime: m.createdTime
                },
                downloadUrl: directDownload
            };
        } catch (e) {
            // API Error එකක් ආවොත් ඒක පෙන්වීම
            const errorMsg = e.response?.data?.error?.message || e.message;
            throw new Error(errorMsg);
        }
    }

    // URL එක ඇතුළෙන් File ID එක පමණක් වෙන් කර හඳුනාගැනීම
    extractId(u) {
        const p = [
            /\/file\/d\/([a-zA-Z0-9_-]+)/, 
            /id=([a-zA-Z0-9_-]+)/, 
            /folders\/([a-zA-Z0-9_-]+)/, 
            /^([a-zA-Z0-9_-]+)$/
        ];
        for (const r of p) {
            const m = u.match(r);
            if (m) return m[1];
        }
        return null;
    }
}

export default async function handler(req, res) {
    // CORS සක්‍රීය කිරීම (වෙනත් සයිට් වල සිට භාවිතා කිරීමට)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');

    const { url } = req.query;

    // URL එක ලබා දී නොමැති නම්
    if (!url) {
        return res.status(400).json({ 
            status: false, 
            message: "කරුණාකර 'url' පරාමිතිය (parameter) ලබා දෙන්න." 
        });
    }

    try {
        const gdrive = new GDrive();
        const result = await gdrive.getDetails(url);
        return res.status(200).json(result);

    } catch (err) {
        // මොකක් හරි වැරදුණොත් Error එක පෙන්වීම
        return res.status(500).json({ 
            status: false, 
            error: err.message 
        });
    }
}
