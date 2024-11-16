const express = require('express');
const app = express();
require("dotenv").config();
const port = 5000;

// Set View Engine
app.set("view engine", "ejs");
app.use(express.static("public"));

const connectToDB = require("./config/db");
// Connection To Database
connectToDB();


// Livereload setup
const path = require("path");
const livereload = require("livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

const connectLivereload = require("connect-livereload");
app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});




// body Parser
const bodyParser = require('body-parser');
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.use(cookieParser());
app.use(session({
  secret: process.env.TOKEN_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Change secure to true if using HTTPS
}));

// passport  for authentication google
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
require('./config/googleauth2');

function isLoggedIn(req, res, next) {
  // console.log("3 hhhhhhhhh");
  //console.log(req.cookies.user);
  if (req.cookies.user) { // Check if req.user exists
    next(); // User is logged in
  } else {
    res.redirect("/auth/google/chatbot");
  }
}


app.get('/chatbot', isLoggedIn, async (req, res) => {
  try {
    //console.log(req.cookies.user);
    //console.log(req.user );
    const userCookie = JSON.parse(req.cookies.user);
    const name = userCookie.name;
    const userId = userCookie._id;
    const idconv = req.query.idconv;
    console.log(idconv);

    // Retrieve all conversations associated with the current user
    const conversations = await Conversation.find({ userId });

    // Extract conversation ID and the first 10 characters of the first user message
    const conversationsData = conversations.map(conversation => {
      console.log(conversation);
      const conversationId = conversation._id;
      const firstUserMessage = conversation.conversation[0].messages.find(message => message.sender === userCookie.name);
      const firstUserMessagePreview = firstUserMessage ? firstUserMessage.content.substring(0, 15) : '';
      return { conversationId, firstUserMessagePreview };
    });

    
    let messages = []; // Initialize messages to an empty array

    if(idconv && idconv != undefined){
      const conversation = await Conversation.findById(idconv);
      messages = conversation.conversation.reduce((allMessages, current) => {
        return allMessages.concat(current.messages);
      }, []);
    }



























    res.render('chatbot', { name: name, id: userId, conversations: conversationsData, idconv ,messages});
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});


app.get(
  '/auth/google/chatbot',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  })
);
app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/auth/protected',
    failureRedirect: '/404',
  })
);
app.use('/auth/logout', (req, res) => {
  res.clearCookie('user'); // Clear the user cookie
  req.session.destroy();
  res.redirect("/index");
});
app.get('/auth/protected', (req, res) => {
  //console.log("2 hhhhhh");
  //console.log(req.user);
  const userCookie = JSON.stringify(req.user);
  res.cookie('user', userCookie, { httpOnly: true, maxAge: 60 * 24 * 60 * 60 * 1000 });
  //res.send(`Cookie set: ${userCookie}`);
  res.redirect("/chatbot");
});






















































// Importing required packages and models
const { Hercai } = require('hercai');
const Conversation = require('./models/Conversation');
const mongoose = require('mongoose');

// Initialize Hercai
const herc = new Hercai(); // Optionally pass your API key here if needed

// Handle requests
app.get('/Hercai/:conversationID/:msg', async (req, res) => {
  try {
    // Extract parameters from the request
    const { conversationID, msg } = req.params;
    // Parse user information from the cookie
    const userCookie = JSON.parse(req.cookies.user);
    const nameuser = userCookie.name;
    const iduser = userCookie._id;

    // Get response from Hercai API
    const response = await herc.question({ model: "turbo", content: msg });
    const reply = response.reply;
    console.log("conversationID:", conversationID);
       
        console.log("msg:", msg);
        console.log("nameuser:", nameuser);
        console.log("iduser:", iduser);
        console.log("reply:", reply); 

    // Save the message and reply in the conversation
    let conversation;
    if (conversationID === 'undefined') {
      console.log("undefined condition");
      // If the conversation doesn't exist, create a new one
      conversation = new Conversation({
        userId: iduser,
        conversation: [{
          conversationID: new mongoose.Types.ObjectId(),
          messages: [{ sender: nameuser, content: msg }, { sender: 'Vega ai', content: reply }]
        }]
      });
      // Save the new conversation
      await conversation.save();
    } else {
      console.log("else condition");
      // If the conversation exists, update it
      conversation = await Conversation.findOneAndUpdate(
        { "conversation.conversationID": conversationID },
        {
          $push: {
            "conversation.$.messages": { sender: nameuser, content: msg, timestamp: new Date() }
          }
        },
        { new: true }
      );
      conversation = await Conversation.findOneAndUpdate(
        { "conversation.conversationID": conversationID },
        {
          $push: {
            "conversation.$.messages": { sender: 'Vega ai', content: reply, timestamp: new Date() }
          }
        },
        { new: true }
      );
    }


    // Send the reply as JSON
    return res.json({ reply });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});












app.get('/index', (req, res) => {
  res.render('index');
});
app.get('/', (req, res) => {
  res.redirect("/index");
});

app.get('/404', (req, res) => {
  res.redirect("/404");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
