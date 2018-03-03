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
var UrlShort = require('../models/search.model');

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
    });

    afterEach(() => {
      this.get.reset();
      request.get.restore();
    });


    it('it should return return image URLs, alt text and page URLs for a set of images', (done) => {
      var stub = sinon.stub(UrlShort.prototype, 'save');
      var expectedResult = {term: "pugs"};
      stub.yields(null, expectedResult);

      var query = expectedResult.term;

      var expectedCSEUrl = process.env.CSE_URL +
        "?key=" + process.env.CSE_API_KEY +
        "&cx=" + process.env.CX_ID +
        "&searchType=image&filter=1" +
        "&q=" + expectedResult.term;
      var expectedReferer = "http://127.0.0.1/api/images/" + query;

      var cseData = initTestData(10);
      this.get.yields(
        null,
        {statusCode: 200},
        cseData
      );

      chai.request(server)
        .get('/api/images/' + expectedResult.term)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.not.have.property('error');

          res.body.should.have.lengthOf(cseData.items.length);

          this.get.should.have.been.calledWith({
            url: expectedCSEUrl,
            headers: { Referer: expectedReferer },
            json: true 
          });

          stub.restore();

          done();
        });
    }),

    it('it should paginate through the responses', (done) => {
      var stub = sinon.stub(UrlShort.prototype, 'save');
      var expectedResult = {term: "pugs"};
      stub.yields(null, expectedResult);

      var offset = 2;
      var query = expectedResult.term + "?offset=" + offset;

      var expectedCSEUrl = process.env.CSE_URL +
        "?key=" + process.env.CSE_API_KEY +
        "&cx=" + process.env.CX_ID +
        "&searchType=image&filter=1" +
        "&q=" + expectedResult.term +
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
          res.body.should.be.a('array');
          res.body.should.not.have.property('error');

          res.body.should.have.lengthOf(cseData.items.length);

          this.get.should.have.been.calledWith({
            url: expectedCSEUrl,
            headers: { Referer: expectedReferer },
            json: true 
          });

          stub.restore();

          done();
        });
    })
  });

  describe("When I want to see most recent searches", () => {
    it('it should return a list of most recently submitted search strings', (done) => {
      var UrlShortMock = sinon.mock(UrlShort);
      var expectedResult = {short: "apple", original:"https://apple.com"};
      UrlShortMock.expects('find').yields(null, expectedResult);

      chai.request(server)
        .get('/api/' + expectedResult.short)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('original');
          res.body.should.have.property('short');

          res.body.original.should.not.be.null;
          res.body.short.should.not.be.null;

          UrlShortMock.verify();
          UrlShortMock.restore();

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

