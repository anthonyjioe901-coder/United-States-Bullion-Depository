const path = require("path");
const { spawn } = require("child_process");

const backend = spawn(
  "npm start",
  {
    cwd: path.join(__dirname, "wealthshield-backend"),
    stdio: "inherit",
    shell: true
  }
);

const frontend = spawn(
  `"${process.execPath}" "${path.join(__dirname, "frontend-server.js")}"`,
  {
    stdio: "inherit",
    shell: true
  }
);

const shutdown = () => {
  if (!backend.killed) backend.kill();
  if (!frontend.killed) frontend.kill();
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

backend.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Backend exited with code ${code}`);
  }
  shutdown();
});

frontend.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`Frontend exited with code ${code}`);
  }
  shutdown();
});
