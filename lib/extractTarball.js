var extractTarball = function (module) {
  var fs = require('fs'),
    path = require('path'),
    cp = require('child_process'),
    dir = path.dirname(__dirname) + '/sources/' +
      module.name + '-' + module.version,
    tarball = dir,
    howToInstall = module.install,
    rootFolder,
    lz;

  this.emit('message', 'Check that tarball not already extracted');

  fs.exists(dir, function (exists) {
    if ( exists ) {
      this.emit('message', 'Tarball already extracted');
      return this.emit('done');
    }
    
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

    this.emit('message', 'Extracting tarball', { tarball: tarball, target: path.dirname(__dirname) + '/sources/' });
    
    lz = cp.spawn('lz', [tarball]);
    
    lz.out = [];
    
    lz.on('error', function (error) {
      this('error',
        this.emit('message', { 'error': 'Could not read tarball' }, error).debug);
    }.bind(this));
    
    lz.stdout.on('data', function (data) {
      lz.out.push(data.toString());
      if ( data.toString().match(/^d/) && ! rootFolder ) {
        rootFolder = data.toString().split(/\s+/)[5];
      }
    }.bind(this));
    
    lz.stderr.on('data', function (data) {
      this.emit('message', { 'warning': 'lz: ' + data.toString() });
    }.bind(this));
    
    lz.on('close', function (code) {
      if ( code && ! rootFolder ) {
        return this.emit('error', new Error(
          this.emit('message', { 'error': 'Could not read tarball' }).message));
      }
      
      var untar = cp.spawn('tar', tarOptions);
      var untarOut = [];
      var untarErr = [];
      
      untar.on('error', function (error) {
        this('error',
          this.emit('message', { 'error': 'Could not extract tarball' }, error).debug);
      }.bind(this));
      
      untar.on('close', function (code) {
        if ( code ) {
          return this.emit('error', new Error(
            this.emit('message', { 'error': 'Extracting tarball failed' }, {
                code: code,
                options: tarOptions,
                out: untarOut,
                err: untarErr
              }).message));
        }
        this.emit('done');
      }.bind(this));
      
      untar.stdout.on('data', function (data) {
        untarOut.push(data.toString());
      });
      
      untar.stderr.on('data', function (data) {
        untarErr.push(data.toString());
      });
    }.bind(this));
  }.bind(this));
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(extractTarball, [module]);
};