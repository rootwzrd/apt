var fs = require('fs');

var AptJson = function (cwd, create) {
  if ( typeof create === 'undefined' ) {
    create = true;
  }
  if  ( ! cwd ) {
    cwd = process.cwd();
  }
  this.File = cwd + '/apt.json';
  try {
    this.Json = require(this.File);
    this.FileExists = true;
    this.Size = Object.keys(this.Json.Dependencies).length ;
    this.Dependencies = this.Json.Dependencies;
    this.Path = this.Json.Path;
  } catch ( error ) {
    this.FileExists = false;
  }
};

AptJson.prototype.JsonToString = function() {
  return JSON.stringify(this.Json, null, 2);
};

AptJson.prototype.get = function(query, then) {
  if ( ! this.FileExists ) {
    return then(new Error('apt.json not found'));
  }
  var got = [], dep = {}, match = true;
  for ( var dependency in this.Json.Dependencies ) {
    match = true;
    for ( var search in query ) {
      if ( query[search] !== this.Json.Dependencies[dependency][search] ) {
        match = false;
      }
    }
    if ( match ) {
      dep = {};
      dep[dependency] = this.Json.Dependencies[dependency];
      got.push(dep);
    }
  }
  then(null, got);
};

AptJson.prototype.init = function(then) {
  if ( this.FileExists ) {
    return then(new Error('Apt.json already exists'));
  }
  require('fs').writeFile(this.File,
    JSON.stringify({
      Path: 'apt',
      Dependencies: {}
    }, null, 2),
    function (error) {
      if ( error ) {
        return then(new Error('Could not write to Apt.json'));
      }
      this.Json = require(this.File);
      this.FileExists = true;
      this.Size = Object.keys(this.Json.Dependencies).length ;
      this.Dependencies = this.Json.Dependencies;
      this.Path = this.Json.Path;
      then();
    }.bind(this));
};

AptJson.prototype.insert = function(module, then) {
  if ( ! this.FileExists ) {
    return this.init(function (error) {
      if ( error ) {
        return then(error);
      }
      this.insert(module, then);
    }.bind(this));
  }
  this.Json.Dependencies[module.name] = module.version;
  fs.writeFile(this.File, this.JsonToString(), then);
};

module.exports = AptJson;