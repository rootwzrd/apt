for ( var args = [], i = 2; i < process.argv.length; i++ ) {
  args.push(process.argv[i]);
}

var action = args[0],
  Local = require('../local.json'),
  Store = require('../store.json');

if ( ! action ) {
  console.log({local: Local.length, store: Store.length});
} else {
  args.shift();
  switch ( action ) {
    case 'view':
      console.log(JSON.stringify(Local, null, 2));
      break;
    case 'search':
      var found = [], where = {};
      args.forEach(function (arg) {
        if ( arg.match(/=/) ) {
          where[arg.split('=')[0]] = arg.split('=')[1];
        } else {
          where.name = arg;
        }
      });
      Store.forEach(function (module) {
        var match = true;
        if ( Object.keys(where).length ) {
          for ( var key in where ) {
            if ( module[key] !== where[key] ) {
              match = false;
            }
          }
        }
        if ( match ) {
          found.push({name: module.name, type: module.type, latest: module.latest.static});
        }
      });
      console.log(JSON.stringify(found, null, 2));
      break;
    case 'install':
      if ( ! args.length ) {
        Local.forEach(function (module) {
          console.log('Installing ' + module.name + ' version ' + module.version);
          require('../lib/install')([module.name, module.version].join('@'), function (error, module) {
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
          });
        });
      }
      else {
        var module = args[0].split('@')[0],
          version = args[0].split('@')[1];
        console.log('Installing ' + module + ' version ' + version);
        require('../lib/install')([module, version].join('@'), function (error, module) {
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