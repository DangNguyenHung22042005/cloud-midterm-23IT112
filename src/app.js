"use strict";

const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { engine } = require("express-handlebars");
const { COLLECTIONS, STUDENT } = require("./config/constants");
const { createBookRouter } = require("./routes/books");

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(value);
}

function createApp({ config, readClientPromise, writeClientPromise }) {
  const app = express();

  app.set("trust proxy", 1);
  app.engine(
    "hbs",
    engine({
      extname: ".hbs",
      defaultLayout: "main",
      helpers: { formatCurrency }
    })
  );
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(express.urlencoded({ extended: false, limit: "20kb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use(
    session({
      name: "midterm.sid",
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        clientPromise: writeClientPromise,
        dbName: config.dbName,
        collectionName: COLLECTIONS.sessions,
        autoRemove: "disabled"
      }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.nodeEnv === "production",
        maxAge: 60 * 60 * 1000
      }
    })
  );

  app.get("/health", async (_req, res) => {
    try {
      const [readClient, writeClient] = await Promise.all([
        readClientPromise,
        writeClientPromise
      ]);
      await Promise.all([
        readClient.db(config.dbName).command({ ping: 1 }),
        writeClient.db(config.dbName).command({ ping: 1 })
      ]);
      res.status(200).json({ status: "ok", studentId: STUDENT.studentId });
    } catch (_error) {
      res.status(503).json({ status: "error" });
    }
  });

  app.use(createBookRouter({ config, readClientPromise, writeClientPromise }));

  app.use((_req, res) => {
    res.status(404).send("Không tìm thấy trang.");
  });

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).send("Hệ thống gặp lỗi. Vui lòng kiểm tra log máy chủ.");
  });

  return app;
}

module.exports = { createApp };
