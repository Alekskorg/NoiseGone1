// /api/clean.js
// Основная функция очистки. Multipart -> tmp -> ffmpeg -> stream -> cleanup

const Busboy = require("busboy");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const tmp = require("tmp");
const { v4: uuidv4 } = require("uuid");
const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const { filtergraphByPreset } = require("../lib/filters");

ffmpeg.setFfmpegPath(ffmpegPath);

const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "video/mp4" // иногда M4A отдаётся как video/mp4
]);

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    let tmpIn = null;
    let preset = "podcast";
    let size = 0;
    let mime = null;

    busboy.on("file", (_name, file, info) => {
      mime = info.mimeType || info.mime || "";
      tmpIn = tmp.fileSync({ postfix: path.extname(info.filename || "") || ".bin" });

      const write = fs.createWriteStream(tmpIn.name);
      file.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) {
          file.unpipe();
          write.destroy();
          return reject({ code: 413, message: "File too large" });
        }
      });
      file.pipe(write);
      file.on("limit", () => reject({ code: 413, message: "File too large" }));
      file.on("error", reject);
      write.on("error", reject);
    });

    busboy.on("field", (name, val) => {
      if (name === "preset") preset = (val || "podcast").toLowerCase();
    });

    busboy.on("finish", () => {
      if (!tmpIn) return reject({ code: 400, message: "No file" });
      resolve({ tmpIn, size, mime, preset });
    });

    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

function contentTypeSupported(mime) {
  if (!mime) return false;
  return ALLOWED.has(mime.toLowerCase());
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  let tmpIn, tmpOut, preset, size, mime;

  try {
    const parsed = await parseMultipart(req);
    ({ tmpIn, size, mime, preset } = parsed);

    if (!contentTypeSupported(mime)) {
      try { tmpIn && fs.existsSync(tmpIn.name) && fs.unlinkSync(tmpIn.name); } catch {}
      return res.status(415).json({ error: "Unsupported Media Type" });
    }

    const filtergraph = filtergraphByPreset(preset);
    tmpOut = tmp.fileSync({ postfix: ".mp3" });

    await new Promise((resolve, reject) => {
      ffmpeg(tmpIn.name)
        .audioFilters(filtergraph)
        .audioBitrate("192k")
        .format("mp3")
        .output(tmpOut.name)
        .on("error", reject)
        .on("end", resolve)
        .run();
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cleaned-${uuidv4().slice(0,8)}.mp3"`
    );

    const stream = fs.createReadStream(tmpOut.name);
    stream.on("close", async () => {
      // cleanup
      try { tmpIn && fs.existsSync(tmpIn.name) && fs.unlinkSync(tmpIn.name); } catch {}
      try { tmpOut && fs.existsSync(tmpOut.name) && fs.unlinkSync(tmpOut.name); } catch {}
    });
    stream.pipe(res);

  } catch (err) {
    // cleanup при ошибке тоже нужен
    try { tmpIn && fs.existsSync(tmpIn.name) && fs.unlinkSync(tmpIn.name); } catch {}
    try { tmpOut && fs.existsSync(tmpOut.name) && fs.unlinkSync(tmpOut.name); } catch {}

    if (err && err.code === 413) {
      return res.status(413).json({ error: "File too large" });
    }
    if (err && err.code === 400) {
      return res.status(400).json({ error: "No file" });
    }
    if (err && err.code === 415) {
      return res.status(415).json({ error: "Unsupported Media Type" });
    }
    // Иначе — внутренняя ошибка
    return res.status(500).json({ error: "Processing error" });
  }
};
