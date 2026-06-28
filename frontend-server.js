const http = require("http");
const fs = require("fs");
const path = require("path");

const START_PORT = Number(process.env.FRONTEND_PORT) || 3000;
const MAX_PORT = START_PORT + 20;
const ROOT = path.resolve(__dirname);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

const createServer = () => http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let relativePath = urlPath === "/" ? "/index.html" : urlPath;
  let filePath = path.join(ROOT, relativePath);
  let resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err) {
      const hasExt = path.extname(relativePath) !== "";
      if (!hasExt) {
        relativePath = `${relativePath}.html`;
        filePath = path.join(ROOT, relativePath);
        resolvedPath = path.resolve(filePath);
        if (!resolvedPath.startsWith(ROOT)) {
          res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Forbidden");
          return;
        }
        return fs.readFile(resolvedPath, (readErr, data) => {
          if (readErr) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not Found");
            return;
          }
          const ext = path.extname(resolvedPath).toLowerCase();
          const contentType = MIME_TYPES[ext] || "application/octet-stream";
          res.writeHead(200, { "Content-Type": contentType });
          res.end(data);
        });
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(resolvedPath, "index.html");
    } else {
      filePath = resolvedPath;
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Server Error");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  });
});

const listenOnPort = (port) => {
  const server = createServer();

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && port < MAX_PORT) {
      listenOnPort(port + 1);
      return;
    }

    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Frontend running on http://localhost:${port}`);
  });
};

listenOnPort(START_PORT);
