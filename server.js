// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const publicDir = __dirname; // файлы index.html и *.js лежат рядом

// Отдаём статически всё как есть
app.use(express.static(publicDir, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    }
    if (filePath.endsWith(".svg")) {
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    }
  }
}));

// Фоллбек только на корневой index, НЕ для путей к .js/.svg
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
