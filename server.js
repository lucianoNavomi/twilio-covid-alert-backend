require("dotenv").config();

const express = require("express");
let bodyParser = require("body-parser");
let cors = require("cors");

const { startDatabase } = require("./database");
const TwilioService = require("./messaging");

const app = express();
const port = process.env.PORT || 3000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.use(cors());

// database instance
const dbSetup = async (req, res, next) => {
  if (!req.db) {
    const db = await startDatabase();
    req.db = db;
  }
  next();
};

app.use(dbSetup);

// endpoint for the root of the API 
app.get("/", (req, res) => {
  res.send("Welcome to the COVID Subscription API!");
});

// ednpoint to fetch a list of all locations
app.get("/locations", async (req, res) => {
  const locations = await req.db.collection("locations").find().toArray();

  res.status(200).send(locations);
});

// endpoint to fetch all subscriptions by users of the application
app.get("/subscriptions", async (req, res) => {
  const subscriptions = await req.db
    .collection("subscriptions")
    .find()
    .toArray();
  res.status(200).send(subscriptions);
});

// Endpoint to Subscribe to COVID-19 Alerts
app.post("/save-subscription", async (req, res) => {
  try {
    //Check for existing subscription
    const subscriptions = await req.db
      .collection("subscriptions")
      .find({
        phone: req.body.phone
      })
      .toArray();

    if (subscriptions.length === 0) {
      const save_sub = await req.db
        .collection("subscriptions")
        .insertOne(req.body);

      res.status(201).send({
        message: "You have successfully subscribed"
      });
    } else {
      res.status(401).send({
        message: "You cannot subscribe more than once"
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

// Endpoint to Send COVID-19 Alerts
app.post("/send-alerts", async (req, res) => {
  //Get all users subscribed to that location
  const subscribers = await req.db
    .collection("subscriptions")
    .find({
      location: req.body.location
    })
    .toArray();

  const messaging_requests = subscribers.map((subscriber) => {
    return TwilioService.sendMessage(
      subscriber.phone,
      TwilioService.buildAlertMessage(req.body)
    );
  });

  const subscriber_mails = subscribers.map((subscriber) => {
    return subscriber.email;
  });

  try {
    //Send SMS
    const send_messages = await Promise.all(messaging_requests);

    //Send Mail
    let mailObject = {
      to: subscriber_mails,
      subject: "COVID Alerts",
      html: TwilioService.buildAlertMail(req.body)
    };
    await TwilioService.sendMail(mailObject);

    res.status(200).send({
      message: "Alerts Successfully sent"
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Something went wrong. Please try again"
    });
  }

});


app.listen(port, () => {
  console.log(`[server] - Example app listening at http://localhost:${port}`);
});