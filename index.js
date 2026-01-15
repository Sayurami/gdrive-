import axios from "axios";

class GDrive {
  constructor() {
    // ඔබේ API Key එක මෙතන තියෙනවා. 
    // ආරක්ෂාව සඳහා මෙය Vercel Environment Variable එකක් ලෙස තැබීම වඩාත් සුදුසුයි.
    this.k = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";
  }

  async download(url) {
    try {
      const id = this.extractId(url);
      if (!id) throw new Error("Invalid Google Drive URL or ID.");

      const { data: m } = await axios.get(`https://www.googleapis.com/drive/v3/files/${id}`, {
        params: {
          key: this.k,
          fields: "id,name,mimeType,size,webContentLink,owners,createdTime"
        }
      });

      // Folder එකක් නම් එහි ඇතුළේ ඇති ෆයිල් ලැයිස්තුව ලබා ගැනීම
      if (m.mimeType === "application/vnd.google-apps.folder") {
        const { data: l } = await axios.get(`https://www.googleapis.com/drive/v3/files`, {
          params: {
            key: this.k,
            q: `'${id}' in parents`,
            fields: "files(id,name,mimeType,size,owners,createdTime)"
          }
        });

        const files = l.files || [];
        return {
          status: true,
          type: "folder",
          details: { id: m.id, name: m.name, totalFiles: files.length },
          contents: files.map(f => ({
            name: f.name,
            size: f.size ? `${(f.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
            downloadUrl: `https://drive.usercontent.google.com/download?id=${f.id}&export=download`
          }))
        };
      }

      // තනි ෆයිල් එකක් නම්
      return {
        status: true,
        type: "file",
        details: {
          name: m.name,
          size: m.size ? `${(m.size / 1024 / 1024).toFixed(2)} MB` : "N/A",
          mimeType: m.mimeType
        },
        downloadUrl: `https://drive.usercontent.google.com/download?id=${m.id}&export=download`
      };

    } catch (e) {
      throw new Error(e.response?.data?.error?.message || e.message);
    }
  }

  extractId(u) {
    const p = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /folders\/([a-zA-Z0-9_-]+)/, /^([a-zA-Z0-9_-]+)$/];
    for (const r of p) {
      const m = u.match(r);
      if (m) return m[1];
    }
    return null;
  }
}

export default async function handler(req, res) {
  // CORS සක්‍රීය කිරීම (වෙනත් වෙබ් අඩවි වල සිට භාවිතා කිරීමට)
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "පරාමිතිය 'url' අවශ්‍ය වේ." });
  }

  try {
    const api = new GDrive();
    const response = await api.download(url);
    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
}
