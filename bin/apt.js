#!/usr/bin/env node
for ( var args = [], i = 2; i < process.argv.length; i++ ) {
  args.push(process.argv[i]);
}

var action = args.shift(),
  apt = require('../main'),
  prettyjson = require('prettyjson');

switch ( action ) {
  case undefined:
    apt('lib/json')
      .on('error', function (error) {
        console.error(error.toString().red);
      })
      .on('done', function (data) {
        console.log(prettyjson.render(data));
      });
    break;
}

return;

if ( ! action ) {
  var package = require('../package.json');
  var AptJson = new (require('../lib/AptJson'))(process.cwd());
  if ( ! AptJson.FileExists ) {
    console.log({});
  }
  else {
    console.log(JSON.stringify(AptJson.Json, null, 2));
  }
} else {
  args.shift();
  switch ( action ) {
    case 'help':
      var npm = require('../package.json');
      console.log(JSON.stringify({ apt: {
        version: npm.version,
        actions: {
          'apt': {
            'about': 'Display apt.json if found in working directory - empty object otherwise',
            'example': 'apt',
            'javascript': 'apt.info()',
            'aliases': [ 'apt info' ]
          },
          'apt check': {
            'about': 'Checkt that apt.json exists and has correct information',
            'example': 'apt check',
            'javascript': 'apt.check()',
            'aliases': []
          },
          'apt init': {
            'about': 'Install apt micro-os',
            'example': 'apt init',
            'javascript': 'apt.init()',
            'aliases': []
          },
          'apt ls': {
            'about': 'View installed dependencies if any',
            'example': 'apt ls',
            'javascript': "apt.ls()",
            'aliases': []
          },
          'apt ls <dependency>': {
            'about': 'View if <dependency> already installed',
            'example': 'apt ls mysql',
            'javascript': "apt.ls('mysql')",
            'aliases': []
          },
          'apt store': {
            'about': 'View available dependencies in Store',
            'example': 'apt store',
            'javascript': "apt.store()",
            'aliases': []
          },
          'apt store <dependency>': {
            'about': 'Search Store for given dependency',
            'example': 'apt store mysql',
            'javascript': "apt.store('mysql')",
            'aliases': []
          },
          'apt install <dependency>': {
            'about': 'Install given dependency',
            'example': 'apt install mysql',
            'javascript': "apt.install('mysql')",
            'aliases': [],
          },
          'apt install <dependency> <config>': {
            'about': 'Install given dependency with user parameters',
            'example': 'apt install mysql config.datadir=/home/joe/data',
            'javascript': "apt.install('mysql', { 'config': { 'datadir': '/home/joe/data' } })",
            'aliases': [],
          }
        }
      } }, null, 2));
      break;
    case 'check':
      var check = apt.load('check')
        // .on('message', apt.message)

        .on('error', function (error) {
          console.log('apt check returned errors'.red, error.toString().red);
          if ( error instanceof Error ) {
            throw error;
          }
          throw new Error(error);
        })

        .on('done', function (checks) {
          var passed = 0,
            failed = 0,
            notdone = 0;
          for ( var check in checks ) {
            if ( checks[check] === true ) {
              passed ++;
            }
            if ( checks[check] === false ) {
              failed ++;
            }
            if ( checks[check] === null ) {
              notdone ++;
            }
          }
          console.log(('Checks: ' + (passed + failed + notdone) ).blue);
          console.log(('Passed: ' + passed).green);
          console.log(('Failed: ' + failed).red);
          console.log(('Not checked: ' + notdone).grey);
          JSON.stringify(checks, null, 2).split(/\n/)
            .forEach(function (line) {
              if ( line.match(/true,?$/) ) {
                console.log(line.green);
              }
              else if ( line.match(/false,?$/) ) {
                console.log(line.red);
              }
              else if ( line.match(/null,?$/) ) {
                console.log(line.grey);
              }
              else {
                console.log(line);
              }
            });
        });
      break;
    
    case 'init':
      var init = apt.load('init')
        .on('error', function (error) {
          throw error;
        })

        .on('done', function () {
          
        });
      break;

    case 'ls':
      var AptJson = new (require('../lib/AptJson'))(process.cwd());
      if ( ! AptJson.FileExists ) {
        console.log(JSON.stringify({}, null, 2));
      } else {
        console.log(JSON.stringify(AptJson.Dependencies, null, 2));
      }
      break;
    
    case 'search':
    case 'store':
      var found = [],
        where = {},
        search = require('../lib/search');
      args.forEach(function (arg) {
        if ( arg.match(/=/) ) {
          where[arg.split('=')[0]] = arg.split('=')[1];
        } else {
          where.name = arg;
        }
      });
      search(where)
        .on('error', function (error) {
          throw error;
        })
        .on('done', function (storedModules) {
            storedModules.forEach(function (module) {
              for ( var tab1 = '', i = module.name.length; i < 10; i ++ ) {
                tab1 += ' ';
              }
              
              var dependencies = ( module.dependencies ? Object.keys(module.dependencies).length +
                ' dependenc' + ( Object.keys(module.dependencies).length === 1 ? 'y' : 'ies' ) : 'no dependency' );
              
              for ( var tab2 = '', j = module.type.length; j < 20; j ++ ) {
                tab2 += ' ';
              }
              
              console.log(('▹ ' + module.name).green + tab1 + module.type + tab2 + dependencies.grey);
          });
        });
      break;
    
    case 'install':
      var install = require('../lib/install'),
        installer = function (error, module) {
          if ( error ) {
            if ( typeof error === 'string' ) {
              switch ( error ) {
                case 'Already installed':
                  console.log(module + ' version ' + version + ' is already installed');
                  break;
                default:
                  throw new Error(error);
              }
            }
            else {
              throw error;
            }
          }
          console.log('Installed'.green, module);
        };
      if ( ! args.length ) {
        Local.forEach(function (module) {
          console.log('Installing ' + module.name + ' version ' + module.version);
          require('../lib/install')([module.name, module.version].join('@'), function (error, module, message) {
            console.log(args);
            if ( error ) {
              if ( typeof error === 'string' ) {
                switch ( error ) {
                  case 'Already installed':
                    console.log(module.name + ' version ' + module.version + ' is already installed');
                    break;
                  default:
                    throw new Error(error);
                }
              }
              else {
                throw error;
              }
            }
            else if ( ! module && message ) {
              console.log(message);
              switch ( Object.keys(message)[0] ) {
                default:
                  var x = ['Installing'.blue,
                    message[Object.keys(message)[0]].grey.italic];
                  if ( message.debug ) {
                    x.push(message.debug);
                  }
                  console.error.apply(null, x);
                  return;
              }
            }
          });
        });
      }
      else {
        apt.load('install', args[0])

          .on('message', apt.message)
          
          .on('error', function (error) {
            throw error;
          })
          
          .on('done', function (module) {
            console.log(module);
          });
      }
      break;
    case 'fetch':
      var fetch = args[0];
      if ( ! fetch ) {
        return console.error('Fetch what?');
      }
      require('../lib/search')(fetch, function (error, found) {
        if ( error ) {
          throw error;
        }
        if ( ! found.length ) {
          return console.log('No such module');
        }
        found.forEach(function ($module) {
          require('../lib/latest')($module, function (error, latest) {
            console.log(arguments);
          });
        });
      });
      break;
  }
}