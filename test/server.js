//During the test the env variable is set to test
process.env.NODE_ENV = 'unit-test';
process.env.DB_URI = "mongodb://localhost/testDatabase";
process.env.DB = "testDatabase";
process.env.COLLECTION = "testCollection";
process.env.PORT = "3010";
process.env.CSE_URL = "https://cse.test"
process.env.CSE_API_KEY = "thisismykey"
process.env.CX_ID = "thisismyid"


var server = require('../server');

var request = require('request')
var sinon = require('sinon');
var mongoose = require('mongoose');

var chai = require('chai');
var chaiHttp = require('chai-http');
var sinonChai = require("sinon-chai");

// set up chai & modules
chai.should();
chai.use(chaiHttp);
chai.use(sinonChai);


function initTestData(count=10) {
  var tmp = "";
  var cseData = {
    items: []
  }
  for (var i=0; i<count; i++) {

    tmp = String.fromCharCode('a'.charCodeAt(0) + i);
    tmp = tmp.repeat(3);

    cseData.items.push({
      link: `http://${tmp}.test1`,
      alt_text: `${tmp}`,
      image: {
        contextLink: `http://${tmp}.context`
      }
    });
  }
  return cseData;
}


// Load the model
var Search = require('../models/search.model');

const sandbox = sinon.sandbox.create();

describe('App', () => {


  describe('When I visit /', () => {
    it('it should return the index view', (done) => {
      chai.request(server)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;

          done();
        });
    })
  });

  describe('When I give a search string', () => {
    beforeEach(() => {
      this.get = sinon.stub(request, 'get');

      this.stubModel = sinon.stub(Search.prototype, 'save');
      this.expectedModel = {term: "pugs"};
      this.stubModel.yields(null, this.expectedModel);

    });

    afterEach(() => {
      this.get.reset();
      request.get.restore();
    });


    it('it should return return image URLs, alt text and page URLs for a set of images', (done) => {
      var query = this.expectedModel.term;

      var expectedCSEUrl = process.env.CSE_URL +
        "?key=" + process.env.CSE_API_KEY +
        "&cx=" + process.env.CX_ID +
        "&searchType=image&filter=1" +
        "&q=" + this.expectedModel.term;
      var expectedReferer = "http://127.0.0.1/api/images/" + query;

      var cseData = initTestData(10);
      this.get.yields(
        null,
        {statusCode: 200},
        cseData
      );

      chai.request(server)
        .get('/api/images/' + query)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.not.have.property('error');

          res.body.query.should.not.be.null;
          res.body.offset.should.not.be.null;
          res.body.count.should.not.be.null;
          res.body.items.should.not.be.null;

          res.body.query.should.equal(this.expectedModel.term);
          res.body.offset.should.equal(0);
          res.body.count.should.equal(cseData.items.length);
          res.body.items.should.have.lengthOf(res.body.count);

          this.get.should.have.been.calledWith({
            url: expectedCSEUrl,
            headers: { Referer: expectedReferer },
            json: true 
          });

          this.stubModel.restore();

          done();
        });
    }),

    it('it should return offset 0 if non integer given', (done) => {
      var offset = 'a';
      var query = this.expectedModel.term + "?offset=" + offset;

      var expectedCSEUrl = process.env.CSE_URL +
        "?key=" + process.env.CSE_API_KEY +
        "&cx=" + process.env.CX_ID +
        "&searchType=image&filter=1" +
        "&q=" + this.expectedModel.term;
      var expectedReferer = "http://127.0.0.1/api/images/" + query;

      var cseData = initTestData(10);
      this.get.yields(
        null,
        {statusCode: 200},
        cseData
      );

      chai.request(server)
        .get('/api/images/' + query)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.not.have.property('error');

          res.body.query.should.not.be.null;
          res.body.offset.should.not.be.null;
          res.body.count.should.not.be.null;
          res.body.items.should.not.be.null;

          res.body.query.should.equal(this.expectedModel.term);
          res.body.offset.should.equal(0);
          res.body.count.should.equal(cseData.items.length);
          res.body.items.should.have.lengthOf(res.body.count);

          this.get.should.have.been.calledWith({
            url: expectedCSEUrl,
            headers: { Referer: expectedReferer },
            json: true 
          });

          this.stubModel.restore();

          done();
        });
    }),

    it('it should paginate through the responses', (done) => {
      var offset = 2;
      var query = this.expectedModel.term + "?offset=" + offset;

      var expectedCSEUrl = process.env.CSE_URL +
        "?key=" + process.env.CSE_API_KEY +
        "&cx=" + process.env.CX_ID +
        "&searchType=image&filter=1" +
        "&q=" + this.expectedModel.term +
        "&start=" + offset;
      var expectedReferer = "http://127.0.0.1/api/images/" + query;

      var cseData = initTestData(10);
      this.get.yields(
        null,
        {statusCode: 200},
        cseData
      );

      chai.request(server)
        .get('/api/images/' + query)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.not.have.property('error');

          res.body.query.should.not.be.null;
          res.body.offset.should.not.be.null;
          res.body.count.should.not.be.null;
          res.body.items.should.not.be.null;

          res.body.query.should.equal(this.expectedModel.term);
          res.body.offset.should.equal(offset);
          res.body.count.should.equal(cseData.items.length);
          res.body.items.should.have.lengthOf(res.body.count);

          this.get.should.have.been.calledWith({
            url: expectedCSEUrl,
            headers: { Referer: expectedReferer },
            json: true 
          });

          this.stubModel.restore();

          done();
        });
    })
  });

  describe("When I want to see most recent searches", () => {
    it('it should return a list of most recently submitted search strings', (done) => {
      var searchMock = sinon.mock(Search);
      var expectedSearchResult = [
        {term: "apple", search_date: "2018-02-12T00:06:17.372Z"},
        {term: "frogs", search_date: "2018-02-12T00:16:17.372Z"}
      ];

      var mockChain = {
        sort: function () {
          return this;
        },
        select: function () {
          return this;
        },
        limit: function () {
          return this;
        },
        exec: function(callback) {
          callback(null, expectedSearchResult);
        }
      };

      sinon.spy(mongoose.Query.prototype, 'sort');
      sinon.spy(mongoose.Query.prototype, 'select');
      sinon.spy(mongoose.Query.prototype, 'limit');
      sinon.stub(mongoose.Query.prototype, 'exec').yields(null, expectedSearchResult);

      chai.request(server)
        .get('/api/history/images')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');

          res.body.count.should.not.be.null;
          res.body.items.should.not.be.null;

          res.body.count.should.equal(expectedSearchResult.length);
          res.body.items.should.have.lengthOf(res.body.count);

          searchMock.verify();
          searchMock.restore();

          done();
        });
    });
  });

  //Drop db connect after all tests
  after(function(done){
    sandbox.restore();
    done();
  });

});

