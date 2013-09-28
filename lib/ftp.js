var Client = require('ftp'),
  fs = require('fs');

var parseUrl = function (url) {
  var parts = {};
  parts.protocol = url.replace(/^([^:]+):\/\/.+$/, '$1');
  parts.domain = url.replace(/^[^:]+:\/\/([^(\/|:)]+).+$/, '$1');
  parts.uri = url.replace(/^[^:]+:\/\/[^(\/|:)]+(.+)$/, '$1');
  return parts;
};

var ftp = function (from, to, then) {};

ftp.get = function (url, target, then) {
  var credentials = parseUrl(url),
    c = new Client();
    console.log(credentials);
  c.on('error', function (error) {
    then(error);
  });
  c.on('ready', function() {
    c.get(credentials.uri, function(error, stream) {
      if ( error ) {
        return then(error);
      }
      stream.once('close', function() {
        c.end();
        then();
      });
      stream.pipe(fs.createWriteStream(target));
    });
  });
  // connect to localhost:21 as anonymous
  c.connect({ host: credentials.domain });
};

module.exports = ftp;