// controllers/devController.js
import pdfParse from "pdf-parse-fixed"; 
import mammoth from "mammoth";

export const parseOnly = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: "file required" });
    }

    const { originalname, mimetype, buffer } = req.file;

    const isPdf = /\.pdf$/i.test(originalname) || /pdf/i.test(mimetype);
    const isDocx = /\.docx$/i.test(originalname) || /word/i.test(mimetype);

    let text = "";

    if (isPdf) {
      const parsed = await pdfParse(buffer);
      text = parsed.text || "";
    } else if (isDocx) {
      const r = await mammoth.extractRawText({ buffer });
      text = r.value || "";
    } else {
      text = buffer.toString("utf8");
    }

    res.json({ success: true, text: text.slice(0, 5000) });
  } catch (err) {
    console.error("parseOnly error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
