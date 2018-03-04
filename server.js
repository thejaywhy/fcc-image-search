var express = require('express');
var app = express();

// Load the model
var mongoose = require('mongoose');
var Search = require('./models/search.model');

// setup our datastore
if ( process.env.NODE_ENV != "unit-test" ) {
  console.log("Trying to connect to db");
  db = mongoose.connect(process.env.DB_URI);
  mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + process.env.DB);
  });
}

// Set up Google Custom Search
var cse = require("./cse");
cse.initializeApp(app);

// Transform the results from google CSE into
// the output we want
function transformResults(cseResults) {
  if (cseResults == null) return [];
  return cseResults.map(function(x) {
    return {
      image_url: x.link,
      alt_text: x.title,
      page_url: x.image.contextLink
    };
  });
}

// root, show welcome page / docs
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// Build the Search Route
app.get("/api/images/:term", function (request, response) { 


  var newSearch = new Search({
    term: request.params.term,
  });

  newSearch.save(function(err, url){
    if (err) return response.status(500).json({"error": err});

  });


  var results, referer = null;

  // get the offset, if any
  var offset = parseInt(request.query.offset);
  if (!offset) offset = 0;

  referer = request.protocol + "://" + request.hostname + request.originalUrl

  results = cse.search(referer, request.params.term, offset);
  if ( results == null ) {
    response.status(500).json({error: "Server Error"}); 
  } else {
    results = transformResults(results);
    response.status(200).json(
      {
        query: newSearch.term,
        offset: offset,
        count: results.length,
        items: results
      });
  }

});


// Build the History Route
app.get("/api/history/images", function (request, response) {  

  Search.recentSearches(function (err, result) {
    if (err) return response.status(500).json({error: "History Server Error"});
    return response.status(200).json({
      count: result.length,
      items: result
    });
  });

});

// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app; // for testing
