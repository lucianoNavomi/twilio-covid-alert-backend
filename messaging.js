//Setup Twilio SMS
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTHTOKEN;
const client = require("twilio")(accountSid, authToken);

//Setup Twilio SendGrid Mail
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.TWILIO_SENDGRID_API_KEY);

const TwilioService = {
  sendMessage,
  sendMail,
  buildAlertMessage,
  buildAlertMail
};

// sends an SMS to a specified recipient
async function sendMessage(recipient, message) {
  const sendResponse = await client.messages.create({
    body: message,
    from: process.env.TWILIO_NUMBER,
    to: recipient
  });

  return sendResponse;
}

// This function sends an email to a specified recipient or list of recipients.
async function sendMail(msgObject) {
  msgObject.from = process.env.TWILIO_SENDGRID_VERIFIED_EMAIL;
  const mailSentResponse = await sgMail.send(msgObject);

  return mailSentResponse;
}

// This function constructs an SMS to be sent to a recipient
function buildAlertMessage(data) {
  const message = `${data.new} new cases have been reported in ${data.location}\n
  Total Confirmed: ${data.confirmed}\n
  Total Discharged: ${data.discharged}\n
  Total Deaths: ${data.deaths}`;

  return message;
}

// This function is similar to the buildAlertMessage(), 
// except while it takes in the same argument it builds and returns an HTML email body
function buildAlertMail(data) {
  const htmlMail = `
    <html>
        <meta charset="utf-8" />
        <meta http-equiv="x-ua-compatible" content="ie=edge" />
      
        <title>COVID Alerts</title>
      
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <body>
          <h2><span style='color:blue'>${data.new}</span> new cases have been reported in ${data.location}</h2>

          <table>
            <tr>
              <td><b>Total Confirmed</b></td>
              <td>${data.confirmed}</td>
            </tr>

            <tr>
              <td><b>Total Discharged</b></td>
              <td>${data.discharged}</td>
            </tr>

            <tr>
              <td><b>Total Deaths</b></td>
              <td>${data.deaths}</td>
            </tr>
          </table>
        </body>
    </html>
  `;

  return htmlMail;
}

module.exports = TwilioService;