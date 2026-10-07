"use strict";

const { STUDENT } = require("../config/constants");

class BookValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BookValidationError";
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function prepareBook(body) {
  const productCode = normalizeText(body.productCode).toUpperCase();
  const title = normalizeText(body.title);
  const author = normalizeText(body.author);
  const priceBeforeTax = Number(body.priceBeforeTax);

  if (!productCode.startsWith(STUDENT.productPrefix)) {
    throw new BookValidationError(
      `Mã sản phẩm phải bắt đầu bằng ${STUDENT.productPrefix}.`
    );
  }

  if (!title) {
    throw new BookValidationError("Tên sách không được để trống.");
  }

  if (!author) {
    throw new BookValidationError("Tác giả không được để trống.");
  }

  if (!Number.isFinite(priceBeforeTax) || priceBeforeTax < 0) {
    throw new BookValidationError("Giá trước thuế phải là số không âm.");
  }

  const priceAfterTax =
    Math.round(priceBeforeTax * (1 + STUDENT.vatRate / 100) * 100) / 100;

  return {
    productCode,
    title,
    author,
    priceBeforeTax,
    vatRate: STUDENT.vatRate,
    priceAfterTax,
    createdAt: new Date()
  };
}

module.exports = { BookValidationError, prepareBook };
