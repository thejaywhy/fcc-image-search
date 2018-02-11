var express = require('express');
var app = express();
var requests = require('request');

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
    console.log("connected:", dsConnected);
  }
  
}

// Wrap the call to Google Custom Search Engine (CSE)
// return the results
// We're building our own instead of using something from NPM
// because that's the whole point :)
function cseSearch(referer, term, start) {
  //#?key=INSERT_YOUR_API_KEY&cx=INSERT_YOUR_CSE_ID&q=QUERY&start=PAGE
  var url = process.env.CSE_URL +
      "?key=" + process.env.CSE_API_KEY +
      "&cx=" + process.env.CX_ID +
      "&q=" + term +
      "&searchType=image";
  //+ "&start=" + start;
     
  var options = {
    url: url,
    headers: {
      'Referer': referer
    },
    json: true
  };
  
  var results = [];
  
  requests(
    options,
    (err, res, body) => {
    if (err) { 
      results = err;
    } else {
      results = body.items;
    }
  });
  
  console.log(results);
  console.log("testing");
  return results;
}

// Transform the results from google CSE into
// the output we want
function transformResults(cseResults) {
  if (cseResults == null) return [];
  console.log(cseResults);
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
  
  results = cseSearch(referer, request.params.term, offset);
  console.log(results);
  if ( results == null ) {
    response.status(500).json({error: "Server Error"}); 
  } else { 
    //response.status(200).json(transformResults(results));
    response.status(200).json({hello: "world"});
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
