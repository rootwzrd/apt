for ( var args = [], i = 2; i < process.argv.length; i++ ) {
  args.push(process.argv[i]);
}

var action = args[0];

require('colors');

var onMessage = require('../lib/helpers/onMessage');

if ( ! action ) {
  var package = require('../package.json');
  console.log('apt'.bold.white + (' version ' + package.version).grey);
  console.log(package.description);
  console.log(('Type ' + 'apt help'.italic + ' for help').grey);
  console.log();
  var AptJson = new (require('../lib/AptJson'))(process.cwd());
  if ( ! AptJson.FileExists || ! AptJson.Size ) {
    console.log('No modules installed'.red);
  }
  var available = require('../Store.json').length;
  console.log((available + ' modules available in Store').green);
  console.log();
  console.log('Thank you for using apt'.italic + ' More info at github.com/co2/apt'.italic.grey);
} else {
  args.shift();
  switch ( action ) {
    case 'view':
      var Local = new (require('../lib/Local'))();
      Local.get({}, function (error, modules) {
        if ( error ) {
          if ( error instanceof Error ) {
            switch ( error.toString() ) {
              case 'Error: apt.json not found':
                return console.log('apt.json not found -- nothing installed so far here!');
              default:
                throw error;
            }
          }
          throw error;
        }
        if ( ! modules.length ) {
          return console.log('Nothing installed so far here!'.blue);
        }
        console.log(JSON.stringify(modules, null, 2));
      });
      break;
    case 'search':
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
        install(args[0])
          .set('message prefix', ['Installing '.blue + args[0].bold.blue])
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