var downloadTarball = function (module) {
  var fs = require('fs'),
    path = require('path'),
    tarball = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    howToDownload = module.install.get.download,
    url,
    protocol;

  switch ( howToDownload.compression ) {
    default:
      return this.emit('error', new Error(
        this.emit('message', { 'error': 'Missing compression' }).message));
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
  
  this.emit('message', 'Downloading tarball', { from: url, to: tarball });

  this.emit('message', 'Check that tarball not already downloaded');

  fs.exists(tarball, function (exists) {
    if ( exists ) {
      this.emit('message', 'Tarball already downloaded');
      return this.emit('done');
    }

    protocol = url.replace(/^([^:]+):\/\/.+$/, '$1');

    this.emit('message', 'Protocol', protocol);

    switch ( protocol ) {
      default:
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'Unknown protocol' }, protocol).message));
      case 'http':
      case 'https':
        require('./download')(url, tarball)
          .set('message prefix', [])
          .on('error', function (error) {
            return this.emit('error', new Error(
              this.emit('message', { 'error': 'Missing compression'} ).message));
          }.bind(this))
          .on('done', function () {
            this.emit('done');
          }.bind(this));
        break;
      case 'ftp':
        require('./ftp').get(url, tarball, function (error) {
          if ( error ) {
            return this.emit('error', new Error(
              this.emit('message', { 'error': 'Could not download tarball' }).message));
          }
          this.emit('done');
        }.bind(this));
    }
  }.bind(this));
};

module.exports = function () {
  var interface = require('./interface');
  return new interface(downloadTarball, arguments);
};