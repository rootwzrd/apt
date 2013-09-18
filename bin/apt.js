require('colors');

var async   = require('async'),
  fs        = require('fs'),
  path      = require('path'),
  glob      = require('glob'),
  cp        = require('child_process');

/** MODEL : LAB MODULE
/*  === === ===
/*  { name: String } 
**/
var ModelLabModule = function ($object) {
  if ( typeof $object !== 'object' ) {
    throw new Error('ModelLabModule: $Object must be an object');
  }
  Apt.echo({'new': 'ModelLabModule', 'object': $object.name});
  for ( var key in $object ) {
    this[key] = $object[key];
  }
};

/** MODEL : RELEASE
/*  === === ===
/*  { release: String } 
**/
var ModelRelease = function ($object) {
  if ( typeof $object === 'string' ) {
    $object = { release: $object };
  }
  Apt.echo({'new': 'ModelRelease', 'object': $object});
  for ( var key in $object ) {
    this[key] = $object[key];
  }
};

var apt = function () {
  this.conn = null;
  this.node_modules = {};
};

/** APT : REQUIRE
/*  === === ===
/*  CommonJS module 
**/
apt.prototype.require = function(module) {
  if ( ! this.node_modules[module] ) {
    this.echo({'importing new node module at runtime': module});
    this.node_modules[module] = require(module);
  }
  return this.node_modules[module];
};

apt.prototype.echo = function(message) {
  //console.warn(JSON.stringify(message, null, 0).grey.bold);
};

apt.prototype.error = function(error, Throw) {
  console.log(error.toString().red.bold);
  if ( Throw ) {
    throw error;
  }
};

apt.prototype.db = function(then) {
  if ( ! this.conn ) {
    this.echo({db: 'connecting'});
    require('mongodb').connect('mongodb://localhost:2007/apt',
      function (err, db) {
        if ( err ) {
          then(err);
        } else {
          this.echo({db: 'connected'});
          this.conn = db;
          then(null, this.conn);
        }
      }.bind(this)
    );
  } else {
    then(null, this.conn);
  }
};

apt.prototype.station = function(modules, then) {
  this.echo({station: modules});
  this.db(
    function (err, db) {
      if ( err ) then(err);
      else {
        db.collection('station',
          function (err, station) {
            if ( err ) then(err);
            else {
              station.find(modules)
                .toArray(then);
            }
          }
        );
      }
    }
  );
};

apt.prototype.stationInsert = function (module, version, then) {
  this.db(function (err, db) {
    if ( err ) {
      then(err);
    } else {
      db.collection('station', function (err, station) {
        if ( err ) {
          then(err);
        } else {
          station.insert({
            name: module.name,
            version: version.release
          }, then);
        }
      });
    }
  });
};

apt.prototype.lab = function(search, then) {
  if ( typeof search == 'string' ) {
    search = { name: search };
  }
  this.db(
    function (err, db) {
      if ( err ) then(err);
      else {
        db.collection('lab',
          function (err, lab) {
            if ( err ) then(err);
            else {
              lab.find(search)
                .toArray(
                  function (err, modules) {
                    if ( err ) then(err);
                    else {
                      this.echo({lab: {found: modules.length + ' module(s)',
                        matching: search }});
                      var lab = [];
                      modules.forEach(
                        function (module) {
                          lab.push(new ModelLabModule(module));
                        }
                      );
                      then(null, lab);
                    }
                  }.bind(this)
                );
            }
          }.bind(this)
        );
      }
    }.bind(this)
  );
};

apt.prototype.latest = function(module, then) {
  var _module = (module instanceof ModelLabModule) ? module.name : module;
  this.echo({latest: { module: _module}});
  if ( ! (module instanceof ModelLabModule) ) {
    this.lab(module,
      function (err, modules) {
        if ( err ) then(err);
        else {
          this.latest(modules[0], then);
        }
      }.bind(this)
    );
  } else {
    var latest = module.latest,
      method = Object.keys(latest)[0];
    switch ( method ) {
      case 'scrape':
        this.scrape({
            from: latest.scrape.from,
            search: latest.scrape.search,
            extract: latest.scrape.extract
          },
          function (err, latest) {
            if ( err ) then(err);
            else {
              this.echo({latest: { module: module.name, latest: latest}});
              then(null, new ModelRelease(latest));
            }
          }.bind(this)
      );
    }
  }
};

apt.prototype.scrape = function(scraper, then) {
  this.echo({'scraping': scraper.from});
  if ( typeof then !== 'function' ) {
    throw new Error('then must be a function');
  }
  var from = scraper.from,
    flags = '',
    group = scraper.group && scraper.group,
    extract = scraper.extract;
  if ( group ) {
    flags += 'g';
  }
  var regex = new RegExp(scraper.search, flags);
  this.require('request')(from,
    function (err, headers, data) {
      if ( err ) {
        console.log(err);
        then(err);
      }
      else {
        var matches = data.match(regex);
        if ( ! matches || ! matches[extract] ) {
          then(new Error('Scrape failed'));
        } else {
          if ( group ) {
            var g = [], gv;
            matches.forEach(
              function (match) {
                g.push(match.replace(new RegExp(scraper.search), '$' + extract));
              }
            );
            then(null, g);
          }
          else {
            then(null, matches[extract]);
          }
        }
      }
    }
  );
};

apt.prototype.shasum = function(profile, version, then) {
  this.echo({shasum: profile});
  var method = Object.keys(profile)[0],
    from = profile[method].from.replace(/\{\{version\}\}/g, version);
  switch ( method ) {
    case 'scrape':
      this.scrape(
        {
          from: from,
          search: profile[method].search.replace(/\{\{version\}\}/g, version.replace(/\./g, '\\.')),
          extract: profile[method].extract,
          group: profile[method].group
        },
        function (err, shasum) {
          if ( err ) then(err);
          else {
            this.echo({shasum: {version: version, shasum: shasum}});
            then(null, shasum);
          }
        }.bind(this)
      );
      break;
  }
};

apt.prototype.version = function(module, version, then) {
  var _module = (module instanceof ModelLabModule) ? module.name : module,
    _version = (version instanceof ModelRelease) ? Object.keys(version)[0] : (
      version ? version : 'undefined');
  if ( ! (module instanceof ModelLabModule) ) {
    this.lab(module,
      function (err, modules) {
        if ( err ) then(err);
        else {
          this.version(modules[0], version, then);
        }
      }.bind(this)
    );
  } else {
    if ( ! version || version == 'latest' ) {
      this.echo({version: { module: _module, version: _version, message: 'Using latest'}});
      this.latest(module, then);
    } else {
      if ( version.match(/^\d+\.\d+\.\d+$/) ) {
        this.versions(module,
          function (err, versions) {
            if ( err ) {
              then(err);
            } else {
              if ( versions.indexOf(version) >= 0 ) {
                this.shasum(module, version,
                  function (err, shasum) {
                    if ( err ) then(err);
                    else {
                      var _ = {};
                      _[shasum] = version;
                      then(null, _);
                    }
                  }
                );
              } else {
                then(null, null);
              }
            }
          }.bind(this)
        );
      } else if ( version.match(/^\d+|x\.\d+|x\.\d+|x$/) ) {
        this.versions(module,
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
                function ($version) {
                  var chunks2 = $version.split('.'),
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
                    candidates.push($version);
                  }
                }.bind(this)
              );
              var candidate = this.sortVersions(candidates).reverse()[0];
              this.echo({'semantic version': version, 'resolved to': candidate});
              then(null, new ModelRelease(candidate));
            }
          }.bind(this)
        );
      }
    }
  }
};

apt.prototype.versions = function(module, then) {
  this.echo({'getting versions of': (module instanceof ModelLabModule) ? module.name : module});
  if ( ! (module instanceof ModelLabModule) ) {
    this.lab(module,
      function (err, packages) {
        if ( err ) {
          then(err);
        } else {
          this.versions(packages[0], then);
        }
      }.bind(this)
    );
  } else {
    var expose = module.expose,
      method = Object.keys(expose)[0];
    switch ( method ) {
      case 'scrape':
        this.scrape(expose.scrape, then);
        break;
    }
  }
        // packages.forEach(
        //   function (pkg) {
        //     var expose = pkg.expose;
        //     if ( ! expose ) {
        //       then(new Error('No method found to expose versions'));
        //     }
        //     echo({'expose method': expose});
        //     var method = Object.keys(pkg.expose)[0];
        //     switch ( method ) {
        //       case 'scrape':
        //         scrape({
        //             from: expose.scrape.from,
        //             search: expose.scrape.search,
        //             extract: expose.scrape.extract,
        //             group: expose.scrape.group
        //           },
        //           function (err, versions) {
        //             if ( err ) then(err);
        //             else {
        //               var v = [], vo;
        //               versions.forEach(
        //                 function (version) {
        //                   shasum(module, version,
        //                     function (err, shasum) {
        //                       if ( err ) then(err);
        //                       else {
        //                         vo = {};
        //                         vo[version] = shasum;
        //                         v.push(vo);
        //                       }
        //                     }
        //                   );
        //                 }
        //               );
        //               then(null, v);
        //             }
        //           }
        //         );
        //         // require('request')(from,
        //         //   function (err, res, body) {
        //         //     // console.log(res);
        //         //     if ( err ) {
        //         //       then(err);
        //         //     } else {
        //         //       var matches = body.match(regex),
        //         //         versions = [];
        //         //       matches.forEach(
        //         //         function (match) {
        //         //           versions.push(match.replace(regex, '$' + extract));
        //         //         }
        //         //       );
        //         //       then(null, versions);
        //         //     }
        //         //   }
        //         // );
        //         break;
        //       case 'json':
        //           var from = pkg.expose.json.from,
        //             isVersion = pkg.expose.json.version,
        //             filters = pkg.expose.json.filter,
        //             versions = [];
        //           require('request')(from,
        //             function (err, res, body) {
        //               if ( err ) {
        //                 then(err);
        //               } else {
        //                 var rows = JSON.parse(body);
        //                 rows.forEach(
        //                   function (row) {
        //                     var passedFilters = true;
        //                     filters.forEach(
        //                       function (filter) {
        //                         if ( ! new RegExp(filter).test(row[isVersion]) ) {
        //                           passedFilters = false;
        //                         }
        //                       }
        //                     );
        //                     if ( passedFilters ) {
        //                       versions.push(row[isVersion]);
        //                     }
        //                   }
        //                 );
        //                 then(null, versions);
        //               }
        //             }
        //           );
        //         break;
        //     }
        //   }
        // );
    //   }.bind(this)
    // );
};

apt.prototype.sortVersions = function(versions) {
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

apt.prototype.createModuleFolder = function (module, then) {
  var folder = path.dirname(__dirname) + '/modules/' + module.name;
  fs.exists(folder, function (exists) {
    if ( exists ) {
      then(null, 1);
    } else {
      fs.mkdir(folder, then);
    }
  });
};

apt.prototype.downloadTarBall = function (module, version, then) {
  var tarball = path.dirname(__dirname) + '/modules/.storage/' +
    module.name + '-' + version.release;
  glob(tarball + '.*', function (err, files) {
    if ( err ) {
      then(err);
    } else {
      if ( files.length ) {
        then(null, files[0]);
      } else {
        switch ( Object.keys(module.install.get)[0] ) {
          case 'download':
            var url = module.install.get.download.url
                .replace(/\{\{version\}\}/g, version.release),
              getExtension = function (extension) {
                  var regex = new RegExp(extension.replace(/\./g,'\.') + '$');
                  if ( regex.test(url) ) {
                    tarball += extension;
                  }
                };
            ['.tar.gz', '.tgz', '.zip'].forEach(getExtension);

            this.download(url, tarball,
              function (err, response) {
                if ( err ) then(err);
                else {
                  /** VERIFY SHASUM **/
                  var labShasum = module.install.get[Object.keys(module.install.get)[0]].shasum;
                  if ( labShasum ) {
                    /** Get lab shasum **/
                    this.shasum(labShasum, version.release,
                      function (err, _shasum) {
                        if ( err ) then(err);
                        else {
                          /** Compare lab shasum with tarball shasum **/
                          var getStorageFileShasum = this.require('child_process')
                            .spawn('sha1sum', [
                              tarball]);
                          getStorageFileShasum.on('error',
                            function (err) {
                              then(err);
                            }
                          );
                          getStorageFileShasum.stdout.on('data',
                            function (data) {
                              var shasum = data.toString().trim().split(/\s/)[0];
                              /** If shasum does not match **/
                              if ( shasum != labShasum ) {
                                then(new Error('Shasum not matching'));
                              }
                              /** If shasum matches **/
                              else {
                                then(null, tarball);
                              }
                            }
                          );
                        }
                      }
                    );
                  }
                }
              }.bind(this)
            );
            break;
        }
      }
    }
  });
};

apt.prototype.extractTarBall = function (tarball, module, version, then) {
  var lz = cp.spawn('lz', [tarball]),
    installFolder;
  lz.on('error',
    function (err) {
      then(err);
    }
  );
  lz.on('close',
    function (code) {
      if ( code && ! installFolder ) {
        then(new Error('lz failed with code: ' + code));
      } else {
        fs.exists(path.dirname(__dirname) + '/modules/.installers/' + installFolder,
          function (exists) {
            if ( exists ) {
              then(null, installFolder);
            } else {
              var uncompress = cp.spawn('tar', [
                '-xzf', tarball, '-C', path.dirname(__dirname) + '/modules/.installers']);
              uncompress.on('error',
                function (err) {
                  then(err);
                }
              );
              uncompress.on('close',
                function (code) {
                  if ( code ) {
                    then(new Error('Could not uncompress tarball (' + code + ')'));
                  } else {
                    then(null, installFolder);
                  }
                }
              );
            }
          });
      }
    }
  );
  lz.stdout.on('data',
    function (data) {
      if ( data.toString().match(/^d/) && ! installFolder ) {
        installFolder = data.toString().split(/\s+/)[5];
      }
    }
  );
};

apt.prototype.make = function (module, version, installer, then) {
  var releaseFolder = path.dirname(__dirname) + '/modules/' +
    module.name + '/' + version.release;
  fs.exists(releaseFolder, function (exists) {
    if ( exists ) {
      then(null, releaseFolder);
    } else {
      var configure = cp.spawn('./configure', [
        '--prefix=' + releaseFolder], {
          cwd: path.dirname(__dirname) + '/modules/.installer/' + installer
        }
      );
      configure.on('error',
        function (err) {
          then(err);
        }
      );
      configure.on('close',
        function (code) {
          if ( code ) {
            then(new Error('configure failed with code: ' + code));
          }
          var make = cp.spawn('make', [], {
            cwd: path.dirname(__dirname) + '/modules/.installer/' + installer
          });
          make.on('error',
            function (err) {
              then(err);
            }
          );
          make.on('close',
            function (code) {
              if ( code ) {
                then(new Error('configure failed with code: ' + code));
              }
              var install = cp.spawn('make install', [], {
                cwd: path.dirname(__dirname) + '/modules/.installer/' + installer
              });
              install.on('error',
                function (err) {
                  then(err);
                }
              );
              install.on('close',
                function (code) {
                  then(null, releaseFolder);
                }
              );
              install.stdout.on('data',
                function (data) {
                  console.log({stdout: data.toString() });
                }
              );
              install.stderr.on('data',
                function (data) {
                  console.log({stderr: data.toString() });
                }
              );
            }
          );
          make.stdout.on('data',
            function (data) {
              console.log({stdout: data.toString() });
            }
          );
          make.stderr.on('data',
            function (data) {
              console.log({stderr: data.toString() });
            }
          );
        }
      );
      configure.stdout.on('data',
        function (data) {
          console.log({stdout: data.toString() });
        }
      );
      configure.stderr.on('data',
        function (data) {
          console.log({stderr: data.toString() });
        }
      );
    }
  });
};

apt.prototype.install = function(module, version, then) {
  /** VERIFY THAT MODULE IS A MODULE PROFILE **/
  if ( ! (module instanceof ModelLabModule) ) {
    return this.lab({name: module},
      function (err, modules) {
        if ( err ) then(err);
        else {
          if ( ! modules.length ) {
            then(new Error('No modules found'));
          } else {
            module = modules[0];
            this.install(module, version, then);
          }
        }
      }.bind(this)
    );
  }

  this.station({ name: module.name }, function (err, results) {
    if ( err ) {
      then(err);
    } else if ( ! results.length ) {
      /* MAKE SURE VERSION IS VERIFIED **/
      if ( ! (version instanceof ModelRelease) ) {
        return this.version(module, version,
          function (err, version) {
            if ( err ) then(err);
            else {
              this.install(module, version, then);
            }
          }.bind(this)
        );
      }
      
      this.downloadTarBall(module, version, function (err, tarball) {
        if ( err ) {
          then(err);
        } else {
          this.extractTarBall(tarball, module, version, function (err, installer) {
            if ( err ) {
              then(err);
            } else {
              this.make(module, version, installer, function (err, folder) {
                if ( err ) {
                  then(err);
                } else {
                  this.stationInsert(module, version, function (err, insert) {
                    if ( err ) {
                      then(err);
                    } else {
                      then(null, module.name, version.release);
                    }
                  });
                }
              }.bind(this));
            }
          }.bind(this));
        }
      }.bind(this));
    } else {
      then(new Error('Already installed!'), module.name, results[0].version);
    }
  }.bind(this));
};

apt.prototype.download = function(source, to, then, method) {
  if ( ! method ) {
    method = 'request';
  }
  this.echo({downloading: source, using: method});
  this.require('request-progress')(
    this.require('request')(source), {
      // throttle: 2000,
      // delay: 1000
    }
  ).on('progress', function (state) {
    var divider, unit, convert = function (num) {
      if ( num >= 1024 ) {
        if ( num >= (1024*1024) ) {
          if ( num >= (1024*1024*1024) ) {
            divider = (1024*1024*1024);
            unit = 'GB';
          } else {
            divider = (1024*1024);
            unit = 'MB';
          }
        } else {
          divider = 1024;
          unit = 'KB';
        }
      } else {
        divider = 1;
        unit = 'B';
      }
      return Math.floor(num / divider) + ' ' + unit;
    }, total = convert(state.total);
    process.stdout.write("Downloaded " + convert(state.received) + '/' +
      total + ' - ' + state.percent + " %                    \r");
  })
  .on('error', function (err) {
      throw err;
  })
  .pipe(this.require('fs').createWriteStream(to))
  .on('error', function (err) {
      // Do something with err
  })
  .on('close', function (err) {
      // Saved to doogle.png!
  });
};

var action  = process.argv[2],
  module    = process.argv[3],
  version   = process.argv[4],
  Apt       = new apt();

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
    Apt.latest(module,
      function (err, latest) {
        if ( err ) {
          Apt.error(err, true);
        }
        console.log(latest);
        Apt.conn.close();
      }
    );
    break;
  case 'versions':
    Apt.versions(module,
      function (err, versions) {
        if ( err ) {
          throw err;
        }
        console.log(versions);
        Apt.conn.close();
      }
    );
    break;
  case 'version':
    Apt.version(module, version,
      function (err, release) {
        if ( err ) then(err);
        else {
          console.log(release);
          Apt.conn.close();
        }
      }
    );
    break;
  case 'lab':
    Apt.lab(module,
      function (err, lab) {
        if ( err ) {
          throw err;
        }
        console.log(JSON.stringify(lab, null, 2));
        Apt.conn.close();
      }
    );
    break;
  case 'station':
    case '':
    case null:
    case undefined:
    Apt.station({},
      function (err, packages) {
        if ( err ) {
          throw err;
        }
        console.log(packages);
        Apt.conn.close();
      }
    );
    break;
  case 'install':
    Apt.install(module, version,
      function (err, module, version) {
        Apt.conn.close();
        if ( err ){
          switch ( err.toString().replace(/^Error: /, '') ) {
            case 'Already installed!':
              console.log(module + ' already installed at version ' + version);
              break;
            default:
              throw err;
          }
        }
        else {
          console.log(module + ' installed at version ' + version);
        }
      }
    );
    break;
}