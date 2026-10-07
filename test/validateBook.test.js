"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  BookValidationError,
  prepareBook
} = require("../src/middleware/validateBook");

test("accepts product code with prefix 112 and calculates VAT 8%", () => {
  const book = prepareBook({
    productCode: "112book001",
    title: "Cloud Computing",
    author: "Test Author",
    priceBeforeTax: "100000"
  });

  assert.equal(book.productCode, "112BOOK001");
  assert.equal(book.vatRate, 8);
  assert.equal(book.priceBeforeTax, 100000);
  assert.equal(book.priceAfterTax, 108000);
});

test("rejects product code without prefix 112", () => {
  assert.throws(
    () =>
      prepareBook({
        productCode: "111BOOK001",
        title: "Cloud Computing",
        author: "Test Author",
        priceBeforeTax: "100000"
      }),
    BookValidationError
  );
});

test("rejects negative price", () => {
  assert.throws(
    () =>
      prepareBook({
        productCode: "112BOOK002",
        title: "Cloud Computing",
        author: "Test Author",
        priceBeforeTax: "-1"
      }),
    BookValidationError
  );
});
