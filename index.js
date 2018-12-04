/*
 * Primary file for API
 *
 */

// Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

 // Configure the server to respond to all requests with a string
var server = http.createServer(function(req,res){

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  var host = req.headers.host;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Get the payload,if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
      buffer += decoder.write(data);
  });
  req.on('end', function() {
      buffer += decoder.end();

      // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
      var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

      // Construct the data object to send to the handler
      var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryStringObject,
        'method' : method,
        'headers' : headers,
        'payload' : buffer,
        'host':host
      };

      // Route the request to the handler specified in the router
      chosenHandler(data,function(statusCode,payload){

        // Use the status code returned from the handler, or set the default status code to 200
        statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

        // Use the payload returned from the handler, or set the default payload to an empty object
        payload = typeof(payload) == 'object' || typeof(payload) == 'string'? payload : {};

        // Convert the payload to a string
        var payloadString = typeof(payload) == 'object' ? JSON.stringify(payload) : payload;

        var content_type = typeof(payload) == 'object' ? 'application/json' : 'html'
        // Return the response
        res.setHeader('Content-Type',content_type);
        res.writeHead(statusCode);
        res.end(payloadString);
        console.log("Returning this response: ",statusCode,payloadString);

      });

  });
});

// Start the server
server.listen(config.port,function(){
  console.log('The server is up and running on port '+config.port+' in '+config.envName+' mode.');
});

// Define all the handlers
var handlers = {};

// Sample handler
handlers.server_name = function(data,callback){
    callback(200,`<h1>This is EC2 ${data.host.split(":")[0]}<h1>`);
};


// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};

handlers.health = function(data,callback){
  callback(200,{"status":"ok"});
};

// Define the request router
var router = {
  '':handlers.server_name,
  'server_name' : handlers.server_name,
  'health' : handlers.health
};
