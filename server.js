var express = require('express');
var app = express();

// setup our datastore
var datastore = require("./datastore").sync;
datastore.initializeApp(app);
var dsConnected=false;

// Get connected to the database
function initializeDatastoreOnProjectCreation() {
  if(dsConnected !== true){
    try {
      dsConnected = datastore.connect() ? true : false;
    } catch (err) {
      console.log("Init Error: " + err);
    }
  }
}

// root, show welcome page / docs
app.get("/", function (request, response) {
  initializeDatastoreOnProjectCreation();

  response.sendFile(__dirname + '/views/index.html');
});

// Build the Search Route
app.get("/api/images", function (request, response) {
  if (!request.body) return response.status(400).json({err: "missing body"});  

  response.status(504).json({error: "not built yet"});
  
});

// Build the History Route
app.get("/api/latest/images", function (request, response) {  
   
  response.status(504).json({error: "not built yet"});
  
});

// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
