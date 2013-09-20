var fs = require('fs');

var path$root = require('path').dirname(__dirname),
  path$sources = path$root + '/sources',
  path$modules = path$root + '/modules',
  path$tarball = path$sources,
  path$source = path$sources;

var downloadTarBall = function (candidate, item, then) {
  path$tarball += '/' + item.name + '-' + item.version;
  require('glob')(path$tarball + '.*', function (error, files) {
    if ( error ) {
      return then(error);
    }
    if ( ! files.length ) {
      switch ( Object.keys(candidate.install.get)[0] ) {
        case 'download':
          var url;
          path$tarball += '.tar.gz';
          if ( typeof candidate.install.get.download.url === 'string' ) {
            url = candidate.install.get.download.url;
          }
          if ( typeof candidate.install.get.download.url === 'object' ) {
            for ( var semexpr in candidate.install.get.download.url ) {
              url = candidate.install.get.download.url[semexpr];
            }
          }
          url = url.replace(/\{\{version\}\}/g, item.version);
          url = url.replace(/\{\{major version\}\}/g, item.version.split('.')[0]);
          url = url.replace(/\{\{minor version\}\}/g, item.version.split('.')[1]);
          url = url.replace(/\{\{patch\}\}/g, item.version.split('.')[2]);
          require('./download')(url, path$tarball, function (error) {
            if ( error ) {
              return then(error);
            }
            return install(item, then);
          });
          break;
      }
    } else {
      path$tarball = files[0];
      path$source += '/' + item.name + '-' + item.version;
      then(null);
    }
  });
};

var extractTarBall = function (candidate, item, then) {
  fs.exists(path$source, function (exists) {
    if ( ! exists ) {
      require('./extract')(path$tarball, { extractTo: path$sources },
        function (error, file) {
          if ( error ) {
            return then(error);
          }
          return install(item, then);
        });
    } else {
      then(null);
    }
  });
};

var buildSource = function (candidate, item, then) {
  fs.exists(path$source, function (exists) {
    if ( ! exists ) {
      switch ( candidate.install.build ) {
        case 'configure-make-install':
          require('./build')(__dirname + '/../sources/' + file, {
              prefix: __dirname + '/../modules/' + item.name +
                '/' + item.version
            }, then);
          break;
        
        case 'copy':
          var target = __dirname + '/../modules/' + item.name;
          if ( ! fs.existsSync(target) ) {
            if ( ! fs.mkdirSync(target) ) {
              return then(new Error('Can not create ' + target));
            }
          }
          target += '/' + item.version;
          if ( ! fs.existsSync(target) ) {
            if ( ! fs.mkdirSync(target) ) {
              return then(new Error('Can not create ' + target));
            }
          }
          require('ncp').ncp(__dirname + '/../sources/' + file,
            target,
            function (error)  {
              if (error) {
                return then(error);
              }
              then(null);
            });
          break;
      }
    }
    else {
      then(null);
    }
  });
};

var Local = require('./Local');

var install = function (item, then) {
  if ( typeof item === 'string' ) {
    item = {
      name: item.split('@')[0],
      version: item.split('@')[1]
    };
  }
  require('./search')(item, function (error, found) {
    if ( error ) {
      return then(error);
    }
    found.forEach(function (candidate) {
      var module = {
        name: candidate.name,
        version: item.version
      };
      Local.get(module, function (error, local) {
        if ( error ) {
          return then(error);
        }
        if ( local.length ) {
          return then('Already installed', module);
        } else {
          downloadTarBall(candidate, item, function (error) {
            if ( error ) {
              return then(error);
            }
            extractTarBall(candidate, item, function (error) {
              if ( error ) {
                return then(error);
              }
              buildSource(candidate, item, function (error) {
                if ( error ) {
                  return then(error);
                }
                Local.insert(module, function (error) {
                  if ( error ) {
                    return then(error);
                  }
                  then(null, module);
                });
              });
            });
          });
        }
      });
    });
  });
};

module.exports = install;