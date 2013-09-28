var buildSource = function (module) {
	var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.store.name + '-' + module.meta.version,
    howToInstall = module.store.install,
    howToBuild,
    buildMethod;

  for ( var semanticVersion in howToInstall ) {
    if ( module.meta.semantic.match(semanticVersion) ) {
      this.emit('message', 'Using how-to install for versions ' + semanticVersion);
      howToBuild = howToInstall[semanticVersion].build;

      break;
    }
  }

  if ( ! howToBuild ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'No how-to install found this version' }).message));
  }

  buildMethod = Object.keys(howToBuild)[0];

  this.emit('message', 'Build method', buildMethod);

  switch ( buildMethod ) {
    default:
      return this.emit('error', new Error(
        this.emit('message', { 'error': 'Unknown build method' }, buildMethod).message));

    case 'configure-make-install':
      require('./configure-make-install')(module)
        .set('message prefix', ['Configure-make-install module '.blue + module.store.name.bold.blue])
        .on('error', function (error) {
          return this.emit('error', new Error(
            this.emit('message', { 'error': 'Could not configure-make-install' }).message));
        }.bind(this))
        .on('done', function () {
          this.emit('message', { 'ok': 'configure-make-install' });
          this.emit('done');
        }.bind(this));
      break;
  }
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(buildSource, [module]);
};