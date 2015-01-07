var express = require('express');
var http = require('http');
var app = express();
var betfair = require('./index');
var stats = require('./stats');

////////// INITIAL APP DETAILS //////////

var APP_KEY = process.env.BF_APP_KEY;
var USERNAME = process.env.BF_USERNAME;
var PASSWORD = process.env.BF_PASSWORD;
var PORT = 8080;
var HOST_API = 'http://localhost:'+PORT;

////////// LOGIN ON STARTUP //////////

var session = betfair.newSession(APP_KEY);
session.login(USERNAME,PASSWORD, function(err) {
  if(!err){
    session._logged = true;
    stats.setSession(session);
  }
});




////////// WEB FOLDER //////////

app.use('/web',express.static(__dirname + '/web', {
  maxAge : 0
}));


////////// ROUTES //////////

app.get('/', function (Req, Res) {
  Res.json(
    {
      appKey: APP_KEY,
      sessionKey: session.sessionKey,
      methods: [
        HOST_API + '/inplay',
        HOST_API + '/marketData'
      ],
      test_methods: [
        HOST_API + '/countries',
        HOST_API + '/venues',
        HOST_API + '/competitions',
        HOST_API + '/events',
        HOST_API + '/eventTypes',
        HOST_API + '/marketTypes',
        HOST_API + '/marketCatalogue',
        HOST_API + '/marketBook',
        HOST_API + '/timeRanges',
        HOST_API + '/logout',
      ]
    });
});



app.get('/startMarket', function (Req, Res) {
  stats.saveMarketData(Req.query.marketId);
  Res.json({ result: true});
});

app.get('/stopMarket', function (Req, Res) {
  stats.stopMarketPoll(Req.query.marketId);
  Res.json({ result: true});
});



app.get('/marketData', function (Req, Res) {
  stats.getMarketData("123",function(data){
    Res.json({ result: data});
  });
});


app.get('/inplay', function (Req, Res) {
  stats.getInPlay(function(obj){
    Res.json({ result: obj});
  });
});

////////// TEST METHODS //////////

app.get('/countries', function (Req, Res) {
  session.listCountries({filter: {}}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/venues', function (Req, Res) {
  session.listVenues({filter: {}}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/competitions', function (Req, Res) {
  session.listCompetitions({filter: {
    "eventTypeIds": [1]
  }}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/events', function (Req, Res) {
  session.listEvents({filter: {
    "eventTypeIds": [1],
    inPlayOnly: true
  }}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/eventTypes', function (Req, Res) {
  session.listEventTypes({filter: {}}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/marketTypes', function (Req, Res) {
  session.listMarketTypes({filter: {}}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/marketCatalogue', function (Req, Res) {
  session.listMarketCatalogue({
    filter: {
      inPlayOnly: true,
      eventTypeIds: [1]
    },
    maxResults: 5
  }, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/marketBook', function (Req, Res) {
  session.listMarketBook({
    filter: { eventTypeIds: [1] },
    maxResults: 5,
    marketIds : ["1.116768294"]
  }, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/timeRanges', function (Req, Res) {
  session.listTimeRanges({filter: {}}, function(err,res) {
    Res.json({ error: err, result: res.response.result});
  });
});

app.get('/logout', function (Req, Res) {
  session.logout(function(err) {
    if(!err) session._logged = false;
    Res.json({ error: err, logged: session._logged});
  });
});


////////// STARTING SERVER //////////

app.listen(PORT);

console.log("Node.js is running in " + app.get('env') + " on port " + PORT);

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

