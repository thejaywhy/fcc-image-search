// Define the Search schema

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MAX_HISTORY_TO_BE_STORED = 15;
var MAX_HISTORY_TO_GET = 10

var SearchSchema = new Schema({
  term: { type: String, required: true},
  search_date: {
    type: Date,
    // `Date.now()` returns the current unix timestamp as a number
    default: Date.now
  }
});

SearchSchema.statics.recentSearches = function recentSearches(callback) {
  this.find()
    .sort({search_date: -1})
    .limit(MAX_HISTORY_TO_GET)
    .select({term: 1, search_date: 1, _id: 0})
    .exec(callback);
}

var SearchModel = mongoose.model('Search', SearchSchema);

module.exports = SearchModel;
