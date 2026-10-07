"use strict";

const express = require("express");
const { COLLECTIONS, STUDENT } = require("../config/constants");
const {
  BookValidationError,
  prepareBook
} = require("../middleware/validateBook");

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

      const message = req.session.message || null;
      const error = req.session.error || null;
      delete req.session.message;
      delete req.session.error;
      req.session.pageViews = (req.session.pageViews || 0) + 1;

      res.render("books", {
        pageTitle: "Quản lý sách",
        books,
        message,
        error,
        pageViews: req.session.pageViews,
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

      req.session.message = `Đã thêm sách ${book.productCode} với VAT ${book.vatRate}%.`;
      res.redirect("/books");
    } catch (error) {
      if (error instanceof BookValidationError) {
        req.session.error = error.message;
        return res.status(400).redirect("/books");
      }

      return next(error);
    }
  });

  return router;
}

module.exports = { createBookRouter };
