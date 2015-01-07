// (C) 2015 Gal Dubitski
//
// Betfair Sports API Stats Methods
//

var _=require('underscore');

function Stats(){
  MarketTimers = [];
  POLL_FREQUENCY = 200; // 200ms max poll frequency
};

Stats.prototype = Stats.fn = {};

Stats.fn.setSession = function(session){
	var self = this;
  self.session = session;
  // start mongodb
  var sys = require('sys');
  var exec = require('child_process').exec;
  function puts(error, stdout, stderr) { sys.puts(stdout) }
  exec("mongod --dbpath /Users/gal/Desktop/betfair/data --rest", puts);  

  // Retrieve
  var MongoClient = require('mongodb').MongoClient;
  // Connect to the db and stats collection
  MongoClient.connect("mongodb://localhost:27017/betfairDB", function(err, db) {
    if(!err) {
      console.log("We are connected");
      self.db = db;
    }
    else {
      console.log(err);
    }
  });
}


Stats.fn.getMarketData = function(marketId, callback){
  var request = require('request');
  request('http://127.0.0.1:28017/betfairDB/markets/', function (error, response, body){
    var rowvals = JSON.parse(body).rows;
    var data = [];
    _.each(rowvals,function(val){
      console.log(val);
      if(val.time){
        var time = new Date(val.time).getTime();
        var odd = val.back;
        data.push([time,odd]);
      }
    });
    callback(data);
  });
}


Stats.fn.saveMarketInfo = function(marketId){
  // market name
  // save open and closing time
  // save bet delay
}

// This function will store all data of a specific market in the database
Stats.fn.saveMarketData = function(marketId){
  var self = this;
  var markets = self.db.collection('markets');
  self.MarketTimers = [];
  self.MarketTimers[marketId] = setInterval(function(){
    // get marketBook
    self.session.listMarketBook({
      marketIds: [marketId]
    }, function(err,res) {
      var data = res.response.result[0];
      //markets.insert(doc2, {w:1}, function(err, result) {});
      markets.insert({
        marketId: marketId,
        time: data.lastMatchTime,
        back: data.runners[0].lastPriceTraded,
        lay: data.runners[1].lastPriceTraded,
        status: data.status,
        totalMatched: data.totalMatched,
        totalAvailable: data.totalAvailable
      },{w:0});
    });
  }, self.POLL_FREQUENCY);
}

Stats.fn.stopMarketPoll = function(marketId){
  var self = this;
  clearInterval(self.MarketTimers[marketId]);
}








Stats.fn.getInPlay = function(callback){
  var self = this;
  var filters = { inPlayOnly: true, eventTypeIds: [1] };
  var maxResults = 100;
  // get all opened markets for in play events
  self.session.listMarketCatalogue({
    filter: filters,
    maxResults: maxResults
  }, function(err,res) {
  	var markets = res.response.result;
  	var marketIDs = [];
  	_.each(markets,function(market){
  		marketIDs.push(market.marketId);
  	});
  	self.session.listMarketBook({
  		filter: filters,
    	maxResults: maxResults,
    	marketIds: marketIDs,
  	}, function(err,res) {
	    callback(res.response.result);
	  });
  });
}



module.exports = new Stats();