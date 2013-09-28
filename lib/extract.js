var verbose = require('verbose');
verbose = new verbose();
verbose.setVerbosity(true);

var extract = function (tarball, options, then) {
  if ( typeof tarball !== 'string' ) {
    return then(new Error('Tarball missing'));
  }
  verbose.setNamespace('apt.extract');
  verbose.log('Extracting ' + tarball);
  if ( typeof options === 'function' && ! then ) {
    then = options;
    options = {};
  }
  var compression;
  if ( tarball.match(/\.tar\.gz$/) ) {
    compression = 'gzip';
  }
  if ( tarball.match(/\.tar\.bz2$/) ) {
    compression = 'bzip2';
  }
  if ( ! compression ) {
    return then(new Error('Unknown compression'));
  }
  var tarOptions = [];
  switch ( compression ) {
    case 'gzip':
      tarOptions.push('-xzf');
      break;
    case 'bzip2':
      tarOptions.push('-xjf');
      break;
  }
  tarOptions.push(tarball);
  if ( typeof options === 'object' ) {
    if ( typeof options.extractTo === 'string' ) {
      tarOptions.push('-C');
      tarOptions.push(options.extractTo);
    }
  }
  var child_process = require('child_process');
  var rootFolder;
  var lz = child_process.spawn('lz', [tarball]);
  lz.on('error', function (error) {
    then(error);
  });
  lz.stdout.on('data', function (data) {
    console.log({'lz-out': data.toString()});
    if ( data.toString().match(/^d/) && ! rootFolder ) {
      rootFolder = data.toString().split(/\s+/)[5];
    }
  });
  lz.stderr.on('data', function (data) {
    console.log({'lz-err': data.toString()});
  });
  lz.on('close', function (code) {
    if ( code && ! rootFolder ) {
      return then(new Error('Could not read directory'));
    }
    var untar = child_process.spawn('tar', tarOptions);
    var untarOut = [];
    var untarErr = [];
    untar.on('error', function (error) {
      then(error);
    });
    untar.on('close', function (code) {
      if ( code ) {
        return then(
          new Error('Extracting tarball failed'),
          {
            code: code,
            options: tarOptions,
            out: untarOut,
            err: untarErr
          });
      }
      then(null, rootFolder);
    });
    untar.stdout.on('data', function (data) {
      untarOut.push(data.toString());
    });
    untar.stderr.on('data', function (data) {
      untarErr.push(data.toString());
    });
  });
};

module.exports = extract;