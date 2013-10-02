for ( var args = [], i = 2; i < process.argv.length; i++ ) {
  args.push(process.argv[i]);
}

var action = args[0];

require('colors');

var onMessage = require('../lib/helpers/onMessage');

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
          'view installed dependencies':  'apt ls',
          'view if a dependency is installed': 'apt ls mysql',
          'search store': 'apt store mysql',
          'install dependency': 'apt install mysql',
          'install dependency given version': 'apt install mysql@5.5.5',
          'install dependency semantic version': [
            'apt install mysql@5.x',
            'apt install mysql@"5.5.x<>5.6.7"'],
          'specify a configure directive': 'apt install mysql config.datadir=/data/mysql'
        }
      } }, null, 2));
      break;
    case 'check':
      var check = {
        'gcc': null
      };

      require('../lib/checkGcc')()
        .on('error', function (error) {
          throw error;
        }.bind(this))

        .on('done', function (found) {
          check.gcc = found;
          console.log(JSON.stringify(check, null, 2));
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