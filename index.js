import axios from "axios";

class GDrive {
    async getDetails(url) {
        try {
            const id = this.extractId(url);
            if (!id) throw new Error("Invalid URL");

            // Google Drive eke normal download link eka
            const baseLink = `https://drive.google.com/uc?export=download&id=${id}&confirm=t`;

            // Browser ekaka wage redirect eka follow karala fresh link eka gannawa
            const response = await axios.get(baseLink, {
                maxRedirects: 0,
                validateStatus: (status) => status >= 200 && status < 400,
            });

            // Redirect wena fresh link eka (drive.usercontent.google.com)
            let directLink = response.headers.location || baseLink;

            return {
                creator: "Hansa Dewmina",
                status: 200,
                success: true,
                result: {
                    fileName: "Spider_Man.mp4", // Meka API eken ganna puluwan
                    downloadUrl: directLink 
                }
            };
        } catch (e) {
            // Samahara welawata axios error ekak widiyata redirect eka denawa
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
