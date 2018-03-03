"use strict";

var requests = require('request');
var sync = require("synchronize");

// Define our search URL
var CSE_URL = process.env.CSE_URL +
    "?key=" + process.env.CSE_API_KEY +
    "&cx=" + process.env.CX_ID +
    "&searchType=image" +
    "&filter=1";

// Define an error object
function SearchError(data, ex) {
  this.type = this.constructor.name;
  this.description = "Upstream search error";
  this.data = data;
  this.error = ex;
}

// Wrap the call to Google Custom Search Engine (CSE)
// return the results
// We're building our own instead of using something from NPM
// because that's the whole point :)
function cseSearch(referer, term, start) {     
  return new Promise(function (resolve, reject) {
    try {
      var url = "&q=" + term;

      if ( start > 0 ) {
        url = url + "&start=" + start;
      }

      var options = {
        url: CSE_URL + url,
        headers: {
          'Referer': referer
        },
        json: true
      };

      requests.get(options, function (err, res, body) {
        if (err) reject(new SearchError("Search Error", err));
        if (res.statusCode != 200) reject(new SearchError("Error Code: " + res.statusCode, err));
        resolve(body.items);
      });

    } catch(ex) {
      reject(new SearchError("Unknown Search Error", ex));
    }
  });

}

function cseSearchCallback(referer, term, start, callback) {
  cseSearch(referer, term, start)
    .then(function (value) {
      callback(null, value);
    })
    .catch(function (err) {
      callback(err, null);
    });
}

function cseSearchSync(referer, term, start) {
  return sync.await(cseSearchCallback(referer, term, start, sync.defer()));
}

function initializeApp(app) {
  app.use(function (req, res, next) {
    sync.fiber(next);
  });
}

module.exports = {
  initializeApp: initializeApp,
  search: cseSearchSync
};
