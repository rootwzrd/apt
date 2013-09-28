var fs = require('fs');

var Local = function (cwd, create) {
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
  } catch ( error ) {
    this.FileExists = false;
  }
};

Local.prototype.JsonToString = function() {
  return JSON.stringify(this.Json, null, 2);
};

Local.prototype.get = function(query, then) {
  if ( ! this.FileExists ) {
    return then(new Error('apt.json not found'));
  }
  var got = [];
  for ( var dependency in this.Json.Dependencies ) {
    for ( var search in query ) {
      if ( query[search] !== this.Json.Dependencies[dependency][search] ) {
        break;
      }
    }
    got.push({ dependency: this.Json.Dependencies[dependency] });
  }
  then(null, got);
};

Local.prototype.init = function(query, then) {
  if ( ! then && typeof query === 'function' ) {
    then = query;
    query = {};
  }
  if ( ! this.FileExists ) {
    require('fs').writeFile(this.File,
      JSON.stringify({
        Path: 'apt',
        Dependencies: {}
      }, null, 2),
      function (error) {
        if ( error ) {
          return then(new Error('Could not write to Apt.json'));
        }
        then();
      });
  } else {
    return then(new Error('Apt.json already exists'));
  }
};

Local.prototype.insert = function(module, then) {
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

module.exports = Local;