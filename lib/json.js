module.exports = function AptJson (create) {
  // this.emit('done', {});
  // return;
  var fs = require('fs'),
    path = require('path'),
    self = this,
    pkg = require('../package.json'),
    Raw,
    Json = {
      apt: {
        version: pkg.version
      },
      base: this.base,
      json: false,
      os: false
    },
    File = path.join(Json.base, 'apt.json');

  if ( typeof create === 'undefined' ) {
    create = true;
  }

  fs.readFile(File, function (error, data) {
    if ( error ) {
      if ( error.code === 'ENOENT' ) {
        return self.emit('done', Json);
      }
      return self.emit('error', error);
    }
    
    Json.json = true;
    
    Raw = JSON.parse(data.toString());

    if ( typeof Raw.apt !== 'object' ) {
      return self.emit('error', new Error('Missing apt in Json'));
    }

    if ( typeof Raw.os === 'object' ) {
      Json.os = Raw.os;
    }

    self.emit('done', Json);
  });
};