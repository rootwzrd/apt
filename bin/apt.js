var ASYNC = require('async'),
  FS = require('fs'),
  PATH = require('path'),
  REQUEST = require('request'),
  CP = require('child_process');

var wget = function(from, to, then) {
  var _wget = CP.spawn('wget',
    ['-O', to, from],
    {
      stdio: 'inherit'
    });
};

var path = PATH.dirname(__dirname);

var download_ = function (url, local, then) {
  var stream = FS.createWriteStream(local),
    size = 0,
    diff = 0,
    seconds = 0,
    streaming = true,
    progress = function () {
      FS.stat(stream.path,
        function (err, stat) {
          if ( err ) {
            then(err);
          } else {
            seconds ++;
            if ( streaming ) {
              diff = stat.size - size;
              size = stat.size;
              console.log((Math.round((size / 1024 / 1024) * 100) / 100) + ' Mb, ' +
                (Math.round((diff / 1024) * 100) / 100) + ' Kb/s');
              setTimeout(progress, 1000);
            }
          }
        }
      );
    };
  console.log('downloading '+url);
  REQUEST(url,
    function (err, res, data) {
      if ( err ) {
        then(err);
      } else {
        if ( res.statusCode == 200 ) {
          streaming = false;
          FS.stat(stream.path,
            function (err, stat) {
              if ( err ) {
                then(err);
              } else {
                console.log('Done: downloaded ' +
                  (Math.round((stat.size / 1024 / 1024) * 100) / 100) + ' Mb at '
                  + (Math.round(((stat.size / seconds) / 1024) * 100) / 100) + ' Kb/s from '
                  + url + ' to ' + local
                );
                then(null, res, data);
              }
            }
          );
        } else {
          then(new Error('Download failed with status ' + res.statusCode));
        }
      }
    }).pipe(stream);
  progress();
};

var $db = null;

var db = function (then) {
  if ( ! $db ) {
    require('mongodb').connect('mongodb://localhost:2007/apt',
      function (err, db) {
        if ( err ) {
          then(err);
        } else {
          $db = db;
          then(null, $db);
        }
      })
  } else {
    then(null, $db);
  }
};

var get = function (filter, then) {
  if ( typeof filter == 'string' ) {
    filter = { name: filter };
  }
  db(
    function (err, db) {
      if ( err ) {
        then(err);
      } else {
        db.collection('packages',
          function (err, packages) {
            if ( err ) {
              then(err);
            } else {
              packages.find(filter).toArray(
                function (err, results) {
                  if ( err ) {
                    then(err);
                  } else {
                    then(null, results);
                  }
                }
              );
            }
          }
        );
      }
    }
  );
};

var lab = function (filter, then) {
  if ( typeof filter == 'string' ) {
    filter = { name: filter };
  }
  db(
    function (err, db) {
      if ( err ) {
        then(err);
      } else {
        db.collection('lab',
          function (err, lab) {
            if ( err ) {
              then(err);
            } else {
              lab.find(filter).toArray(
                function (err, results) {
                  if ( err ) {
                    then(err);
                  } else {
                    then(null, results);
                  }
                }
              );
            }
          }
        );
      }
    }
  );
};

var install = function (pkg, version, then) {
  getVersion(pkg, version,
    function (err, release) {
      if (err) {
        then(err);
      } else {
        get(pkg,
          function (err, packages) {
            if ( err ) {
              then(err);
            } else {
              if ( ! packages.length ) {
                lab(pkg,
                  function (err, lab) {
                    if ( err ) {
                      then(err);
                    } else {
                      var download = lab[0].install.download,
                        downloadMethod = Object.keys(download)[0];
                      switch ( downloadMethod ) {
                        case 'github':
                          var vendor    = download.github.vendor,
                            repo        = download.github.repo,
                            prefix      = download.github.prefix,
                            from        = 'https://github.com/'+vendor+'/'+repo+'/archive/'+
                                            prefix+release+'.tar.gz',
                            sourcePath  = path + '/sources/' + pkg,
                            to          = pkg + '-' + release + '.tar.gz',
                            distTag     = (+new Date()).toString() + Math.random().toString();
                          FS.exists(sourcePath,
                            function (exists) {
                              if ( ! exists ) {
                                FS.mkdirSync(sourcePath);
                              }
                              FS.exists(sourcePath + '/' + to,
                                function (exists) {
                                  if ( ! exists ) {
                                    // wget(from, sourcePath + '/' + to,
                                    //   function () {
                                    //     console.log(arguments);
                                    //   }
                                    // );
                                    // WGET.download('https://codeload.github.com/joyent/node/tar.gz/v0.10.15', to)
                                      // .on('error',
                                      //   function (err) {
                                      //     then(err);
                                      //   }
                                      // )
                                      // .on('end',
                                      //   function (output) {
                                      //     console.log('done');
                                      //   }
                                      // )
                                      // .on('progress',
                                      //   function (progress) {
                                      //     console.log(progress);
                                      //   }
                                      // );
                                  } else {
                                    console.log('sources zip already downloaded');
                                  }
                                }
                              );
                                    
                            }
                          );
                          break;
                      }
                    }
                  }
                );
              }
            }
          }
        );
      }
    }
  );
};

var getLatest = function (filter, then) {
  lab(filter,
    function (err, packages) {
      if ( err ) {
        throw err;
      }
      packages.forEach(
        function (pkg) {
          var latest = pkg.latest;
          if ( ! latest ) {
            throw new Error('No method found to get latest version');
          }
          var method = Object.keys(pkg.latest)[0];
          switch ( method ) {
            case 'scrape':
              var from = pkg.latest.scrape.from,
                regex = new RegExp(pkg.latest.scrape.search),
                extract = pkg.latest.scrape.extract;
              require('http').get(from,
                function (res) {
                  var response = '';
                  res.on('data',
                    function (data) {
                      response += data.toString();
                    }
                  );
                  res.on('end', function () {
                    var matches = response.match(regex);
                    if ( ! matches[extract] ) {
                      throw new Error('Could not fetch latest version');
                    }
                    then(null, matches[extract]);
                  });
                }
              ).on('error', function (err) {
                throw err;
              });
              break;
          }
        }
      );
    }
  );
}

var getVersions = function (filter, then) {
  search(filter,
    function (err, packages) {
      if ( err ) {
        throw err;
      }
      $db.close();
      packages.forEach(
        function (pkg) {
          var expose = pkg.expose;
          if ( ! expose ) {
            throw new Error('No method found to expose versions');
          }
          var method = Object.keys(pkg.expose)[0];
          switch ( method ) {
            case 'scrape':
              var from = pkg.expose.scrape.from,
                regex = new RegExp(pkg.expose.scrape.search, 'g'),
                extract = pkg.expose.scrape.extract;
              require('request')(from,
                function (err, res, body) {
                  // console.log(res);
                  if ( err ) {
                    then(err);
                  } else {
                    var matches = body.match(regex),
                      versions = [];
                    matches.forEach(
                      function (match) {
                        versions.push(match.replace(regex, '$' + extract));
                      }
                    );
                    then(null, versions);
                  }
                }
              );
              break;
            case 'json':
                var from = pkg.expose.json.from,
                  isVersion = pkg.expose.json.version,
                  filters = pkg.expose.json.filter,
                  versions = [];
                require('request')(from,
                  function (err, res, body) {
                    if ( err ) {
                      then(err);
                    } else {
                      var rows = JSON.parse(body);
                      rows.forEach(
                        function (row) {
                          var passedFilters = true;
                          filters.forEach(
                            function (filter) {
                              if ( ! new RegExp(filter).test(row[isVersion]) ) {
                                passedFilters = false;
                              }
                            }
                          );
                          if ( passedFilters ) {
                            versions.push(row[isVersion]);
                          }
                        }
                      );
                      then(null, versions);
                    }
                  }
                );
              break;
          }
        }
      );
    }
  );
}

var getVersion = function (pkg, version, then) {
  if ( ! version || version == 'latest' ) {
    getLatest({name: pkg}, then);
  } else {
    if ( version.match(/^\d+\.\d+\.\d+$/) ) {
      getVersions({name: pkg},
        function (err, versions) {
          if ( err ) {
            then(err);
          } else {
            if ( versions.indexOf(version) >= 0 ) {
              then(null, version);
            } else {
              then(null, null);
            }
          }
        }
      );
    } else if ( version.match(/^\d+|x\.\d+|x\.\d+|x$/) ) {
      getVersions({name: pkg},
        function (err, versions) {
          if ( err ) {
            then(err);
          } else {
            var chunks = version.split('.'),
              major = chunks[0] == 'x' ? null : +chunks[0],
              minor = chunks[1] == 'x' ? null : +chunks[1],
              patch = chunks[2] == 'x' ? null : +chunks[2],
              candidates = [];
            versions.forEach(
              function (version) {
                var chunks2 = version.split('.'),
                  match = true;
                if ( major ) {
                  if ( +chunks2[0] != major ) {
                    match = false;
                  }
                }
                if ( minor ) {
                  if ( +chunks2[1] != minor ) {
                    match = false;
                  }
                }
                if ( match ) {
                  candidates.push(version);
                }
              }
            );
            then(null,
              sortVersions(candidates).reverse()[0]);
          }
        }
      );
    }
  }
};

var sortVersions = function (versions) {
  var vobj = {},
    sort = [];
  versions.forEach(
    function (version) {
      var chunks = version.split('.');
      if ( ! vobj[chunks[0]] ) {
        vobj[chunks[0]] = {};
      }
      if ( ! vobj[chunks[0]][chunks[1]] ) {
        vobj[chunks[0]][chunks[1]] = [];
      }
      if ( vobj[chunks[0]][chunks[1]].indexOf(+chunks[2]) == -1 ) {
        vobj[chunks[0]][chunks[1]].push(+chunks[2]);
      }
      vobj[chunks[0]][chunks[1]] = vobj[chunks[0]][chunks[1]].sort(function(a,b) {
        return (a-b);
      });
    }
  );
  for ( var major in vobj ) {
    for ( var minor in vobj[major] ) {
      vobj[major][minor].forEach(
        function (patch) {
          sort.push([major, minor, patch].join('.'));
        }
      );
    }
  }
  return sort;
};

for ( var i = 2,
          action = 'ls',
          package = {}; i < process.argv.length; i ++ ) {
  if ( i == 2 ) {
    action = process.argv[i];
  }
  if ( i == 3 ) {
    package.name = process.argv[i];
  }
}

switch ( action ) {
  case 'help':
  case '--help':
  case '-h':
    db(
      function (err, db) {
        db.collection('readme',
          function (err, readme) {
            if ( err ) {
              throw err;
            }
            readme.find({name: 'usage'}).toArray(
              function (err, usage) {
                console.log(JSON.stringify(usage[0].content, null, 2));
                $db.close();
              }
            );
          }
        );
      }
    );
    break;
  case 'latest':
    getLatest(package,
      function (err, latest) {
        if ( err ) {
          throw err;
        }
        console.log(latest);
      });
    break;
  case 'versions':
    getVersions(package,
      function (err, versions) {
        if ( err ) {
          throw err;
        }
        console.log(versions);
      }
    );
    break;
  case 'version':
    var pkg = process.argv[3],
      version = process.argv[4];
    if ( ! pkg ) {
      throw new Error('Missing package to evaluate version from');
    }
    getVersion(pkg, version,
      function (err, version) {
        if ( err ) {
          throw err;
        }
        console.log(version);
      }
    );
    break;
  case 'lab':
    lab(package,
      function (err, lab) {
        if ( err ) {
          throw err;
        }
        console.log(JSON.stringify(lab, null, 2));
        $db.close();
      }
    );
    break;
  case 'ls':
    get({},
      function (err, packages) {
        if ( err ) {
          throw err;
        }
        console.log(packages);
        $db.close();
      }
    );
    break;
  case 'install':
    var pkg = process.argv[3],
      version = process.argv[4];
    if ( ! pkg ) {
      throw new Error('Nothing to install');
    }
    install(pkg, version,
      function (err, res) {
        if ( err ) {
          throw err;
        }
      }
    );
    break;
}