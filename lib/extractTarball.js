module.exports = function extractTarball (module) {
  var fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    dir = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    tarball = dir,
    howToInstall = module.install,
    rootFolder,
    lz,
    self = this,
    apt = require('../main');

  self.emit('message', { 'minor': 'Check that tarball not already extracted' });

  fs.exists(dir, function (exists) {
    if ( exists ) {
      self.emit('message', { 'minor': 'Tarball already extracted' });
      return self.emit('done');
    }

    self.emit('message', { 'minor': 'Tarball not extracted yet' });
    
    var tarOptions = [];
    
    switch ( howToInstall.get.download.compression ) {
      case 'gzip':
        tarOptions.push('-xzf');
        tarball += '.tar.gz';
        break;
      case 'bzip2':
        tarOptions.push('-xjf');
        tarball += '.tar.bz2';
        break;
    }
    
    tarOptions.push(tarball);
    tarOptions.push('-C');
    tarOptions.push(path.dirname(__dirname) + '/sources/');

    self.emit('message', { 'minor': 'Extracting tarball' },
      { tarball: tarball, target: path.dirname(__dirname) + '/sources/' });

    apt.load('spawn', 'lz', [tarball])

      .on('message', function (message) {
        if ( typeof message === 'string' ) {
          if ( message.trim().match(/^d/) && ! rootFolder ) {
            rootFolder = message.trim().split(/\s+/)[5];
          }
        }
      })

      .on('error', function (error) {
        self.emit('error', error);
      })

      .on('done', function () {
        if ( ! rootFolder ) {
          self.emit('message', { 'error': 'could not list compressed archive' });
          return self.emit('error', new Error('could not list compressed archive'));
        }

        self.emit('message', { 'minor': 'root folder' }, rootFolder);

        apt.load('spawn', 'tar', tarOptions)
          .on('message', function () {})

          .on('error', function (error) {
            self.emit('error', error);
          })

          .on('done', function () {
            self.emit('message', { 'ok': 'Tarball extracted' }, rootFolder);
            self.emit('done');
          });
      });
  });
};