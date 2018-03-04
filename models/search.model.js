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
  /*
  this.find({})
    .project({_id:0})
    .sort({search_date: -1})
    .limit(MAX_HISTORY_TO_GET)
    .toArray(function(err, result){
      if (err) return [];
      return result;
  });
  */
  this.find()
    .sort({search_date: -1})
    .select('term search_date')
    .limit(MAX_HISTORY_TO_GET)
    .exec(callback);
}

var SearchModel = mongoose.model('Search', SearchSchema);

module.exports = SearchModel;
