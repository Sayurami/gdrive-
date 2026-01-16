const axios = require("axios");

class GDrive {
    constructor() {
        this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
    }

    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
                params: {
                    key: this.k,
                    fields: "id,name,mimeType,size"
                }
            });

            // Google Drive Direct Download Link එක (confirm=t මගින් virus warning එක bypass කරයි)
            const directDownload = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;

            // ඔයාට අවශ්‍ය විදියට JSON format එක මෙතනදී හදනවා
            return {
                creator: "Hansa Dewmina", // ඔයාට අවශ්‍ය නම මෙතනට දාන්න
                status: 200,
                success: true,
                result: {
                    fileName: m.name,
                    fileSize: m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
                    mimetype: m.mimeType,
                    downloadUrl: directDownload // මේක තමයි කෙලින්ම ලැබෙන ලින්ක් එක
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

// Vercel Handler
module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL required" });

    try {
        const gdrive = new GDrive();
        const response = await gdrive.getDetails(url);
        
        // කෙලින්ම JSON එක response එක විදියට යවනවා
        return res.status(200).json(response);
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
