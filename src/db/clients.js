"use strict";

const { MongoClient } = require("mongodb");

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function connectWithRetry(client, label, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await client.connect();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const waitMilliseconds = attempt * 1500;
      console.warn(
        `Kết nối ${label} thất bại lần ${attempt}; thử lại sau ${waitMilliseconds}ms.`
      );
      await delay(waitMilliseconds);
    }
  }

  throw new Error(`Không thể kết nối ${label}.`);
}

function createDatabaseClients(config) {
  const clientOptions = {
    appName: "cloud-midterm-23IT112",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
  };

  const readClient = new MongoClient(config.readUri, clientOptions);
  const writeClient = new MongoClient(config.writeUri, clientOptions);

  const readClientPromise = connectWithRetry(readClient, "reader");
  // Connect sequentially to avoid a burst of TLS handshakes against the
  // shared Atlas free-tier replica set.
  const writeClientPromise = readClientPromise.then(() =>
    connectWithRetry(writeClient, "writer")
  );

  return {
    readClient,
    writeClient,
    readClientPromise,
    writeClientPromise
  };
}

module.exports = { createDatabaseClients };
