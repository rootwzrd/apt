var extractTarball = function (module) {
  var fs = require('fs'),
    path = require('path'),
    dir = path.dirname(__dirname) + '/sources/' +
      module.store.name + '-' + module.meta.version;
  
  this.emit('message', 'Extracting tarball');

  this.emit('message', 'Check that tarball not already extracted');

  fs.exists(dir, function (exists) {
    if ( exists ) {
      this.emit('message', 'Tarball already extracted');
      return this.emit('done');
    }
  }.bind(this));
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(extractTarball, [module]);
};