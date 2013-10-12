module.exports = function buildSource (module) {
	var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    howToBuild = module.install.build,
    buildMethod = Object.keys(howToBuild)[0],
    self = this,
    apt = require('../main');

  self.emit('message', 'Build method', buildMethod);

  switch ( buildMethod ) {
    default:
      return self.emit('error', new Error(
        self.emit('message', { 'error': 'Unknown build method' }, buildMethod).message));

    case 'configure-make-install':
      apt.load('configure-make-install', module)
        
        .on('message', apt.message)
        
        .on('error', function (error) {
          self.emit('message', { 'error': 'Could not configure-make-install' });
          return self.emit('error', error);
        })
        
        .on('done', function () {
          self.emit('message', { 'ok': 'configure-make-install' });
          self.emit('done');
        });
      break;
  }
};