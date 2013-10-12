module.exports = function downloadTarball (module) {
  var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    howToDownload = module.install.get.download,
    url,
    protocol,
    self = this,
    apt = require('../main');

  switch ( howToDownload.compression ) {
    default:
      return self.emit('error', new Error(
        self.emit('message', { 'error': 'Missing compression' }).message));
    case 'bzip2':
      tarball += '.tar.bz2';
      break;
    case 'gzip':
      tarball += '.tar.gz';
      break;
  }

  var semantic = new (require('./semver')) (module.version);

  url = howToDownload.url
    .replace(/\{\{version\}\}/g, module.version)
    .replace(/\{\{major version\}\}/g, semantic.major)
    .replace(/\{\{minor version\}\}/g, semantic.minor)
    .replace(/\{\{patch\}\}/g, semantic.patch);
  
  self.emit('message', {'minor': 'Downloading tarball'}, { from: url, to: tarball });

  self.emit('message', { 'minor': 'Check that tarball not already downloaded' });

  fs.exists(tarball, function (exists) {
    if ( exists ) {
      self.emit('message', { 'minor': 'Tarball already downloaded' });
      return self.emit('done');
    }

    self.emit('message', { 'minor': 'Tarball not already downloaded' });

    protocol = url.replace(/^([^:]+):\/\/.+$/, '$1');

    self.emit('message', { 'minor': 'Protocol for download' }, protocol);

    switch ( protocol ) {
      default:
        self.emit('message', { 'error': 'Unknown protocol' }, protocol);
        return self.emit('error', new Error('Unknown protocol ' + protocol));
      
      case 'http':
      case 'https':
        apt.load('download', url, tarball)
          .on('message', apt.message)
          
          .on('error', function (error) {
            self.emit('message', { 'error': 'Could not download tarball' } );
            return self.emit('error', new Error('Could not download tarball'));
          })
          
          .on('done', function () {
            self.emit('message', { 'ok': 'Tarball downloaded' });
            self.emit('done');
          });
        break;
      
      case 'ftp':
        apt.load('ftp').get(url, tarball, function (error) {
          if ( error ) {
            return self.emit('error', new Error(
              self.emit('message', { 'error': 'Could not download tarball' }).message));
          }
          self.emit('done');
        });
    }
  });
};