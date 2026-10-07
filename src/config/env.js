"use strict";

const REQUIRED_VARIABLES = [
  "MONGODB_READ_URI",
  "MONGODB_WRITE_URI",
  "SESSION_SECRET"
];

function loadConfig() {
  const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  }

  if (process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET phải có ít nhất 32 ký tự.");
  }

  return Object.freeze({
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 3000,
    dbName: process.env.DB_NAME || "DB_23IT112",
    readUri: process.env.MONGODB_READ_URI,
    writeUri: process.env.MONGODB_WRITE_URI,
    sessionSecret: process.env.SESSION_SECRET
  });
}

module.exports = { loadConfig };
