var downloadTarball = function (module) {
  var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.store.name + '-' + module.meta.version,
    howToInstall = module.store.install,
    howToDownload,
    url;

  for ( var semanticVersion in howToInstall ) {
    if ( module.meta.semantic.match(semanticVersion) ) {
      this.emit('message', 'Using how-to install for versions ' + semanticVersion);
      howToDownload = howToInstall[semanticVersion].get.download;

      break;
    }
  }

  if ( ! howToDownload ) {
    return this.emit('error', new Error(
      this.emit('message', { 'error': 'No how-to install found this version' }).message));
  }

  switch ( howToDownload.compression ) {
    default:
      return this.emit('error', new Error(
        this.emit('message', { 'error': 'Missing compression'} ).message));
    case 'bzip2':
      tarball += '.tar.bz2';
      break;
  }

  url = howToDownload.url
    .replace(/\{\{version\}\}/g, module.meta.version)
    .replace(/\{\{major version\}\}/g, module.meta.semantic.major)
    .replace(/\{\{minor version\}\}/g, module.meta.semantic.minor)
    .replace(/\{\{patch\}\}/g, module.meta.semantic.patch);
  
  this.emit('message', 'Downloading tarball', { from: url, to: tarball });

  this.emit('message', 'Check that tarball not already downloaded');

  fs.exists(tarball, function (exists) {
    if ( exists ) {
      this.emit('message', 'Tarball already downloaded');
      return this.emit('done');
    }

    this.emit('message', 'Tarball is already downloaded');

    require('./download')(url, tarball)
      .set('message prefix', [])
      .on('error', function (error) {
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'Missing compression'} ).message));
      }.bind(this))
      .on('done', function () {
        this.emit('done');
      }.bind(this));
  }.bind(this));
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(downloadTarball, [module]);
};