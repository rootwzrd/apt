var build = function (directory, options, then) {
  require('fs').exists(directory, function (exists) {
    if ( ! exists ) {
      return then(new Error('Directory not found'));
    }
    if ( typeof options === 'function' && ! then ) {
      then = options;
      options = {};
    }
    var cp = require('child_process'),
      prefix,
      configureOptions = [];
    if ( typeof options.prefix === 'string' ) {
      prefix = options.prefix;
    }
    if ( prefix ) {
      configureOptions.push('--prefix');
      configureOptions.push(prefix);
    }
    var configure = cp.spawn('./configure', configureOptions, {
        cwd: directory
      }),
      configureOut = [],
      configureErr = [];
    configure.on('error', function (error) {
      then(error);
    });
    configure.stdout.on('data', function (data) {
      configureOut.push(data.toString());
    });
    configure.stderr.on('data', function (data) {
      configureErr.push(data.toString());
    });
    configure.on('close', function (code) {
      if ( code ) {
        return then(
          new Error('Could not configure'),
          {
            code: code,
            options: configureOptions,
            out: configureOut,
            err: configureErr
          });
      }
      var make = cp.spawn('make', { cwd: directory }),
        makeOut = [],
        makeErr = [];
      make.on('error', function (error) {
        then(error);
      });
      make.stdout.on('data', function (data) {
        makeOut.push(data.toString());
      });
      make.stderr.on('data', function (data) {
        makeErr.push(data.toString());
      });
      make.on('close', function (code) {
        if ( code ) {
          return then(
            new Error('Could not make'),
            {
              code: code,
              options: makeOptions,
              out: makeOut,
              err: makeErr
            });
        }
        var install = cp.spawn('make', ['install'], { cwd: directory }),
          installOut = [],
          installErr = [];
        install.on('error', function (error) {
          then(error);
        });
        install.stdout.on('data', function (data) {
          installOut.push(data.toString());
        });
        install.stderr.on('data', function (data) {
          installErr.push(data.toString());
        });
        install.on('close', function (code) {
          if ( code ) {
            return then(
              new Error('Could not install'),
              {
                code: code,
                options: installOptions,
                out: installOut,
                err: installErr
              });
          }
          then(null);
        });
      });
    });
  });
};

module.exports = build;