"use strict";

const { MongoClient } = require("mongodb");

function createDatabaseClients(config) {
  const clientOptions = {
    appName: "cloud-midterm-23IT112",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000
  };

  const readClient = new MongoClient(config.readUri, clientOptions);
  const writeClient = new MongoClient(config.writeUri, clientOptions);

  const readClientPromise = readClient.connect();
  const writeClientPromise = writeClient.connect();

  return {
    readClient,
    writeClient,
    readClientPromise,
    writeClientPromise
  };
}

module.exports = { createDatabaseClients };
