// Define the Search schema

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MAX_HISTORY_TO_BE_STORED = 15;
var MAX_HISTORY_TO_GET = 10


const SearchSchema = new Schema({
  short: { type: String, required: true},
  original: { type: String, required: true }
});

var SearchModel = mongoose.model('Search', SearchSchema);

function recentSearches() {
  return []
}

module.exports = SearchModel;

