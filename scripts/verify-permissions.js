"use strict";

require("dotenv").config();

const { MongoClient } = require("mongodb");
const { loadConfig } = require("../src/config/env");
const { COLLECTIONS, STUDENT } = require("../src/config/constants");

async function expectDenied(label, operation) {
  try {
    await operation();
    console.error(`FAIL: ${label} đã thành công ngoài mong đợi.`);
    process.exitCode = 1;
  } catch (error) {
    if (error.code === 13 || /not authorized/i.test(error.message)) {
      console.log(`PASS: ${label} bị từ chối đúng thiết kế.`);
      return;
    }
    throw error;
  }
}

async function verify() {
  const config = loadConfig();
  const readClient = new MongoClient(config.readUri);
  const writeClient = new MongoClient(config.writeUri);

  try {
    await Promise.all([readClient.connect(), writeClient.connect()]);
    const readBooks = readClient.db(config.dbName).collection(COLLECTIONS.books);
    const writeBooks = writeClient.db(config.dbName).collection(COLLECTIONS.books);

    await readBooks.findOne({});
    console.log("PASS: reader_23IT112 đọc collection books thành công.");

    await expectDenied("reader_23IT112 ghi collection books", () =>
      readBooks.insertOne({ productCode: `${STUDENT.productPrefix}DENIED` })
    );

    await expectDenied("writer_23IT112 đọc collection books", () =>
      writeBooks.findOne({})
    );

    const productCode = `${STUDENT.productPrefix}VERIFY${Date.now()}`;
    await writeBooks.insertOne({
      productCode,
      title: "Permission verification record",
      author: STUDENT.fullName,
      priceBeforeTax: 100000,
      vatRate: STUDENT.vatRate,
      priceAfterTax: 108000,
      createdAt: new Date()
    });
    console.log("PASS: writer_23IT112 thêm sách thành công.");

    const inserted = await readBooks.findOne({ productCode });
    if (!inserted) {
      throw new Error("Reader không tìm thấy bản ghi kiểm thử vừa thêm.");
    }
    console.log("PASS: reader_23IT112 đọc được bản ghi do writer tạo.");
  } finally {
    await Promise.allSettled([readClient.close(), writeClient.close()]);
  }
}

verify().catch((error) => {
  console.error("Kiểm thử thất bại:", error.message);
  process.exit(1);
});
