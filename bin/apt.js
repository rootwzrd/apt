require('colors');

var ModelLabModule = function ($object) {
  for ( var key in $object ) {
    this[key] = $object[key];
  }
};

var ModelRelease = function ($string) {
  this.toString = function () {
    return $string;
  };
};

var apt = function () {
  this.conn = null;
  this.node_modules = {};
};

apt.prototype.require = function(module) {
  if ( ! this.node_modules[module] ) {
    this.echo({require: module});
    this.node_modules[module] = require(module);
  }
  return this.node_modules[module];
};

apt.prototype.echo = function(message) {
  console.warn(JSON.stringify(message, null, 0).grey.bold);
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

apt.prototype.lab = function(modules, then) {
  this.echo({lab: (modules ? modules : {})});
  if ( typeof modules == 'string' ) {
    modules = { name: modules };
  }
  this.db(
    function (err, db) {
      if ( err ) then(err);
      else {
        db.collection('lab',
          function (err, lab) {
            if ( err ) then(err);
            else {
              lab.find(modules)
                .toArray(
                  function (err, modules) {
                    if ( err ) then(err);
                    else {
                      var lab = [];
                      modules.forEach(
                        function (module) {
                          lab.push(new ModelLabModule(module));
                        }
                      );
                      then(null, lab);
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

apt.prototype.latest = function(module, then) {
  this.echo({latest: (module instanceof ModelLabModule) ? module.name : module});
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
              this.shasum(module, new ModelRelease(latest),
                function (err, shasum) {
                  if ( err ) then(err);
                  else {
                    var response = {};
                    response[latest] = shasum;
                    then(null, response);
                  }
                }
              );
            }
          }.bind(this)
      );
    }
  }
};

apt.prototype.scrape = function(scraper, then) {
  this.echo({scrape: scraper});
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
      if ( err ) then(err);
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

apt.prototype.shasum = function(module, version, then) {
  this.echo({shasum: (module instanceof ModelLabModule) ? module.name : module});
  if ( ! (module instanceof ModelLabModule) ) {
    this.lab({name: module},
      function (err, module) {
        if ( err ) then(err);
        else {
          this.shasum(module, version, then);
        }
      }
    );
  } else if ( ! (version instanceof ModelRelease) ) {
    this.version(module, version,
      function (err, version) {
        if ( err ) then(err);
        else {
          this.shasum(module, version, then);
        }
      }.bind(this)
    );
  } else {
    var shasum = module.shasum;
    shasum.from = shasum.scrape.replace(/\{\{version\}\}/g, version.toString());
    shasum.search = shasum.search.replace(/\{\{version\}\}/g, version.toString().replace(/\./g, '\\.'));
    scrape(shasum, then);
  }
};

apt.prototype.version = function(module, version, then) {
  this.echo({version: (module instanceof ModelLabModule) ? module.name : module});
  if ( ! version || version == 'latest' ) {
    this.latest(module, then);
  } else {
    if ( version.match(/^\d+\.\d+\.\d+$/) ) {
      this.versions(module,
        function (err, versions) {
          if ( err ) {
            then(err);
          } else {
            console.log(versions);
            if ( versions.indexOf(version) >= 0 ) {
              then(null, new ModelRelease(version));
            } else {
              then(null, null);
            }
          }
        }
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
              }.bind(this)
            );
            then(null,
              this.sortVersions(candidates).reverse()[0]);
          }
        }.bind(this)
      );
    }
  }
};

apt.prototype.versions = function(module, then) {
  this.echo({versions: (module instanceof ModelLabModule) ? module.name : module});
  if ( ! (module instanceof ModelLabModule) ) {
    this.lab(module,
      function (err, packages) {
        if ( err ) {
          then(err);
        } else {
          this.versions(packages[0], version, then);
        }
      }.bind(this)
    );
  } else {
    var expose = module.expose,
      method = Object.keys(expose)[0];
    this.echo({versions: { method: expose}});
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













var ASYNC = require('async'),
  FS = require('fs'),
  PATH = require('path'),
  REQUEST = require('request'),
  CP = require('child_process');

var echo = function (message) {
  console.warn(JSON.stringify(message, null, 0).grey.bold);
};

var wget = function(from, info, then) {
  var args = ['--debug'];
  if ( typeof info == 'object' ) {
    for ( var key in info ) {
      switch ( key ) {
        case 'O':
        case 'output':
        case 'target':
          args.push('-O');
          args.push(info[key]);
          break;
        case 'c':
        case 'continue':
        case 'resume':
          args.push('--continue');
          break;
      }
    }
  }
  args.push(from);
  var wget = CP.spawn('wget', args);
  wget.on('error',
    function (err) {
      console.log({'wget error': err});
    }
  );
  wget.on('close',
    function (code) {
      if ( code !== 0 ) {
        then(new Error('wget failed with error code ' + code));
      }
    }
  );
  wget.on('exit',
    function (signal) {
      console.log({'wget exit signal': signal});
    }
  );
  wget.stderr.setEncoding('utf-8');
  wget.stderr.on('data',
    function (data) {
      console.log({'wget stderr': data});
    }
  );
};

var path = PATH.dirname(__dirname);

var downloadFromGitHub = function (info, then) {
  if ( typeof info != 'object' ) {
    then(new Error('Downloading from github failed: info must be an object'));
  } else {
    var vendor = info.vendor,
      repo = info.repo,
      release = info.release,
      prefix = ((info.prefix) ? info.prefix : '');
    if ( ! vendor ) {
      then(new Error('Downloading from github failed: missing vendor'));
    } else if ( ! repo ) {
      then(new Error('Downloading from github failed: missing repo'));
    } else if ( ! release ) {
      then(new Error('Downloading from github failed: missing release'));
    } else {
      var dlpath = path + '/sources/' + repo;
      FS.exists(dlpath,
        function (exists) {
          if ( ! exists ) {
            FS.mkdir(dlpath,
              function (err) {
                if ( err ) {
                  then(err);
                } else {
                  downloadFromGitHub(info, then);
                }
              }
            );
          } else {
            var saveAs = repo + '-' + release + '.tar.gz',
              git = CP.spawn('git',[
                  'clone',
                  'https://github.com/' + vendor + '/' + repo + '.git',
                  release ], {
                  cwd: dlpath
                }
              );
            git.on('error',
              function (code) {
                console.log({'got code from downloading from github': code});
              }
            );
            git.stderr.on('data',
              function (data) {
                console.log({'Downloading from github (stderr)': data.toString()});
              }
            );
            git.stdout.on('data',
              function (data) {
                console.log({'Downloading from github (stdout)': data.toString()});
              }
            );

            // new Download(
            //   'https://github.com/' + vendor + '/' + repo + '/archive/' +
            //     prefix + release + '.tar.gz',
            //   dlpath + '/' + saveAs,
            //   function (err, res) {
            //     if ( err ) {
            //       then(err);
            //     } else {
            //       console.log({'Got result from wget': res});
            //     }
            //   }
            // );
            // FS.exists(dlpath + '/' + saveAs,
            //   function (exists) {
            //     if ( exists ) {
            //       console.log('Already downloaded!');
            //     } else {

            //     }
            //   }
            // );
          }
        }
      );
    }
  }
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
      }
    );
  } else {
    then(null, $db);
  }
};

var get = function (filter, then) {
  echo({'get from station': filter});
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
  echo({'searching lab for': filter});

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
                    echo({'Lab returned': { results: results.length, "for": filter }});
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

var install = function (pkg, version, then, step) {
  step = isNaN(step) ? 1 : step;

  console.log({installing: { pkg: pkg, version: version, step: step }});

  var release = version,
    path = PATH.dirname(__dirname);
  
  if ( typeof release != 'string' ||
      ! release.match(/^\d+\.\d+\.\d+$/) ) {
    return getVersion(pkg, version,
      function (err, release) {
        if ( err ) then(err);
        else {
          install(pkg, release, then);
        }
      }
    );
  }

  switch ( step ) {
    /* 1) get package profile from lab */
    case 1:
      lab(pkg,
        function (err, packages) {
          if ( err ) then(err);
          else {
            if ( ! packages.length ) {
              then(new Error('No package found for ' + pkg));
            } else {
              install(packages[0], release, then, 2);
            }
          }
        }
      );
      break;
    /* 2) create directory structure if needed */
    case 2:
      var dirpath = path + '/sources/' + pkg.name;
      FS.exists(dirpath,
        function (exists) {
          if ( ! exists ) {
            console.log({installing: { 'creating directory': dirpath }});
            FS.mkdir(dirpath,
              function (err) {
                if ( err ) then(err);
                else {
                  install(pkg, release, then, step);
                }
              }
            );
          } else {
            var releaseDir = dirpath + '/' + release;
            FS.exists(releaseDir,
              function (exists) {
                if ( ! exists ) {
                  install(pkg, release, then, 3);
                } else {
                  var modulePath = path + '/modules/' + pkg.name;
                  FS.exists(modulePath,
                    function (exists) {
                      if ( ! exists) {
                        FS.mkdir(modulePath,
                          function (err) {
                            if ( err ) then(err);
                            else {
                              install(pkg, release, then, step);
                            }
                          }
                        );
                      } else {
                        var releasePath = modulePath + '/' + version;
                        FS.exists(releasePath,
                          function (exists) {
                            if ( ! exists ) {
                              FS.mkdir(releasePath,
                                function (err) {
                                  if ( err ) then(err);
                                  else {
                                    install(pkg, release, then, step);
                                  }
                                }
                              );
                            } else {
                              var ls = CP.spawn('ls', [releasePath]),
                                files = [];
                              ls.on('error',
                                function (err) {
                                  then(err);
                                }
                              );
                              ls.stdout.setEncoding('utf-8');
                              ls.stdout.on('data',
                                function (data) {
                                  files.push(data.trim());
                                }
                              );
                              ls.on('close',
                                function (code) {
                                  if ( files.length ) {
                                    then(new Error('Already installed'));
                                  }
                                }
                              );
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
      break;
    /* 3) download module sources if needed */
    case 3:
      console.log({installing: 'downloading'});
      for ( var downloadMethod in pkg.install.download );
      switch ( downloadMethod ) {
        case 'github':
          var github = pkg.install.download.github;
          github.release =  version;
          downloadFromGitHub(github,
            function (err, response) {
              if ( err ) then(err);
              else {
                console.log({'got response from git': response});
              }
            }
          );
          break;
      }
      break;
    /* 4) compile module source */
    /* 5) update station database */
  }
};

var getLatest = function (filter, then) {
  echo({'getting latest version of': filter});
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
              scrape({
                  from: pkg.latest.scrape.from,
                  search: pkg.latest.scrape.search,
                  extract: pkg.latest.scrape.extract
                },
                function (err, latest) {
                  if ( err ) then(err);
                  else {
                    shasum(filter, latest,
                      function (err, shasum) {
                        if ( err ) then(err);
                        else {
                          var response = {};
                          response[latest] = shasum;
                          then(null, response);
                        }
                      }
                    );
                  }
                }
              );
              // require('http').get(from,
              //   function (res) {
              //     var response = '';
              //     res.on('data',
              //       function (data) {
              //         response += data.toString();
              //       }
              //     );
              //     res.on('end', function () {
              //       var matches = response.match(regex);
              //       if ( ! matches[extract] ) {
              //         throw new Error('Could not fetch latest version');
              //       }
                      
              //     });
              //   }
              // ).on('error', function (err) {
              //   throw err;
              // });
              break;
          }
        }
      );
    }
  );
};

var getVersions = function (module, then) {
  echo({'exposing versions of': module});
  lab(module,
    function (err, packages) {
      if ( err ) {
        throw err;
      }
      packages.forEach(
        function (pkg) {
          var expose = pkg.expose;
          if ( ! expose ) {
            then(new Error('No method found to expose versions'));
          }
          echo({'expose method': expose});
          var method = Object.keys(pkg.expose)[0];
          switch ( method ) {
            case 'scrape':
              scrape({
                  from: expose.scrape.from,
                  search: expose.scrape.search,
                  extract: expose.scrape.extract,
                  group: expose.scrape.group
                },
                function (err, versions) {
                  if ( err ) then(err);
                  else {
                    var v = [], vo;
                    versions.forEach(
                      function (version) {
                        shasum(module, version,
                          function (err, shasum) {
                            if ( err ) then(err);
                            else {
                              vo = {};
                              vo[version] = shasum;
                              v.push(vo);
                            }
                          }
                        );
                      }
                    );
                    then(null, v);
                  }
                }
              );
              // require('request')(from,
              //   function (err, res, body) {
              //     // console.log(res);
              //     if ( err ) {
              //       then(err);
              //     } else {
              //       var matches = body.match(regex),
              //         versions = [];
              //       matches.forEach(
              //         function (match) {
              //           versions.push(match.replace(regex, '$' + extract));
              //         }
              //       );
              //       then(null, versions);
              //     }
              //   }
              // );
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
};

var getVersion = function (pkg, version, then) {
  echo({'resolving version of': {pkg:pkg, version:version}});

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

var shasum = function (module, version, then) {
  echo({'getting shasum for': { module: module, version: version}});
  lab(module,
    function (err, modules) {
      if ( err ) then(err);
      else {
        var shasum = modules[0].shasum;
        getVersion(module, version,
          function (err, version) {
            if ( err ) then(err);
            else {
              shasum.from = shasum.scrape.replace(/\{\{version\}\}/g, version);
              shasum.search = shasum.search.replace(/\{\{version\}\}/g, version.replace(/\./g, '\\.'));
              scrape(shasum, then);
            }
          }
        );
      }
    }
  );
};

var scrape = function (scraper, then) {
  echo({scraping: scraper});
  var from = scraper.from,
    flags = '',
    group = scraper.group && scraper.group,
    extract = scraper.extract;
  if ( group ) {
    flags += 'g';
  }
  var regex = new RegExp(scraper.search, flags);
  REQUEST(from,
    function (err, headers, data) {
      if ( err ) then(err);
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

var action = process.argv[2],
  module = process.argv[3],
  version = process.argv[4],
  Apt = new apt();

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
  case 'shasum':
    shasum(module, version,
      function (err, shasum) {
        if ( err ) then(err);
        else {
          console.log(shasum);
        }
      }
    );
    break;
  case 'versions':
    getVersions(module,
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
      throw new Error('Missing pkg to evaluate version from');
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