"use strict";

require("dotenv").config();

const { createApp } = require("./app");
const { loadConfig } = require("./config/env");
const { createDatabaseClients } = require("./db/clients");

async function start() {
  const config = loadConfig();
  const databaseClients = createDatabaseClients(config);

  await Promise.all([
    databaseClients.readClientPromise,
    databaseClients.writeClientPromise
  ]);

  const app = createApp({ config, ...databaseClients });
  const server = app.listen(config.port, () => {
    console.log(`Ứng dụng đang chạy tại http://localhost:${config.port}`);
  });

  async function shutdown(signal) {
    console.log(`Nhận ${signal}, đang đóng kết nối...`);
    server.close(async () => {
      await Promise.all([
        databaseClients.readClient.close(),
        databaseClients.writeClient.close()
      ]);
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Không thể khởi động ứng dụng:", error.message);
  process.exit(1);
});
