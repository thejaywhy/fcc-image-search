var express = require('express');
var app = express();


// setup our datastore
var datastore = require("./datastore").sync;
datastore.initializeApp(app);
var dsConnected=false;

var cse = require("./cse");
cse.initializeApp;

// Get connected to the database
function initializeDatastoreOnProjectCreation() {
  if(dsConnected !== true){
    try {
      dsConnected = datastore.connect() ? true : false;
    } catch (err) {
      console.log("Init Error: " + err);
    }
    console.log("connected:", dsConnected);
  }
}

// Transform the results from google CSE into
// the output we want
function transformResults(cseResults) {
  if (cseResults == null) return [];
  return cseResults.map(function(x) {
    //console.log(x);
    return {
      image_url: x.link,
      alt_text: x.title,
      page_url: x.image.contextLink
    };
  });
}

// root, show welcome page / docs
app.get("/", function (request, response) {
  initializeDatastoreOnProjectCreation();

  response.sendFile(__dirname + '/views/index.html');
});

// Build the Search Route
app.get("/api/images/:term", function (request, response) { 
  datastore.saveSearch({term: request.params.term});
  var results, referer = null;
  
  // get the offset, if any
  var offset = request.query.offset;
  if (!offset) offset = 0;
  
  referer = request.protocol + "://" + request.hostname + request.originalUrl
  
  results = cse.search(referer, request.params.term, offset);
  if ( results == null ) {
    response.status(500).json({error: "Server Error"}); 
  } else { 
    response.status(200).json(transformResults(results));
  }
  
});

// Build the History Route
app.get("/api/history/images", function (request, response) {  
   
  response.status(200).json(datastore.recentSearches());
  
});

// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
