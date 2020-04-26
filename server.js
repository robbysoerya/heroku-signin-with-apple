// server.js
// where your node app starts

const express = require("express");
const AppleAuth = require("apple-auth");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({}));

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// The callback route used for Android, which will send the callback parameters from Apple into the Android app.
// This is done using a deeplink, which will cause the Chrome Custom Tab to be dismissed and providing the parameters from Apple back to the app.
app.post("/callbacks/sign_in_with_apple", (request, response) => {
  const redirect = `intent://callback?${new URLSearchParams(
    request.body
  ).toString()}#Intent;package=${
    process.env.ANDROID_PACKAGE_IDENTIFIER
  };scheme=signinwithapple;end`;

  console.log(`Redirecting to ${redirect}`);

  response.redirect(307, redirect);
});

// Endpoint for the app to login or register with the `code` obtained during Sign in with Apple
//
// Use this endpoint to exchange the code (which must be validated with Apple within 5 minutes) for a session in your system
app.post("/sign_in_with_apple", async (request, response) => {
  const auth = new AppleAuth(
    {
      client_id: process.env.CLIENT_ID,
      team_id: process.env.TEAM_ID,
      redirect_uri: "", // does not matter here, as this is already the callback that verifies the token after the redirection
      key_id: process.env.KEY_ID
    },
    process.env.KEY_CONTENTS.split("\\n").join("\n"),
    "text"
  );

  console.log(process.env.KEY_CONTENTS.substring(0, 100));

  const accessToken = await auth.accessToken(request.params.code);

  const idToken = jwt.decode(accessToken.id_token);

  const userID = idToken.sub;

  // `userEmail` and `userName` will only be provided for the initial authorization with your app
  const userEmail = idToken.email;
  const { name: userName } = JSON.parse(request.body.user);

  // 👷🏻‍♀️ TODO: Use the values provided create a new session for the user in your system
  const sessionID = `NEW SESSION ID for ${userID} / ${userEmail} / ${userName}`;

  console.log(`sessionID = ${sessionID}`);

  response.json({ sessionId: sessionID });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
