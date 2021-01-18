// import required packages and data
const { MongoMemoryServer } = require("mongodb-memory-server");
const { MongoClient } = require("mongodb");
const data = require("./db/data");

// define initial database instance
let database = null;

// create the in-memory instance of MongoDB
const mongo = new MongoMemoryServer();

// method that starts up and returns a reference to the database
// gets the MongoDB connection string and uses it to create a new connection to the MongoDB database
async function startDatabase() {
  const mongoDBURL = await mongo.getConnectionString();
  const connection = await MongoClient.connect(mongoDBURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  //Seed Database
  if (!database) {
    database = connection.db();
    await database.collection("locations").insertMany(data.Locations);
  }

  return database;
}

// stop the running database instance
async function stopDatabase() {
  await mongo.stop();
}

module.exports = {
  startDatabase,
  stopDatabase
};