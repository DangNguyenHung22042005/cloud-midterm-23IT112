"use strict";

const express = require("express");
const { COLLECTIONS, STUDENT } = require("../config/constants");
const { prepareBook } = require("../middleware/validateBook");

function createBookRouter({ config, readClientPromise, writeClientPromise }) {
  const router = express.Router();

  router.get("/", (_req, res) => res.redirect("/books"));

  router.get("/books", async (req, res, next) => {
    try {
      const readClient = await readClientPromise;
      const books = await readClient
        .db(config.dbName)
        .collection(COLLECTIONS.books)
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.render("books", {
        pageTitle: "Quản lý sách",
        books,
        message: req.query.message || null,
        error: req.query.error || null,
        student: STUDENT
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/books", async (req, res, next) => {
    try {
      const book = prepareBook(req.body);
      const writeClient = await writeClientPromise;

      await writeClient
        .db(config.dbName)
        .collection(COLLECTIONS.books)
        .insertOne(book);

      const message = encodeURIComponent(
        `Đã thêm sách ${book.productCode} với VAT ${book.vatRate}%.`
      );
      res.redirect(`/books?message=${message}`);
    } catch (error) {
      if (error.message && !error.message.includes("Mongo")) {
        return res
          .status(400)
          .redirect(`/books?error=${encodeURIComponent(error.message)}`);
      }

      return next(error);
    }
  });

  return router;
}

module.exports = { createBookRouter };
