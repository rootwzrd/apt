#!/usr/bin/env node
for ( var args = [], i = 2; i < process.argv.length; i++ ) {
  args.push(process.argv[i]);
}

var action = args[0],
  apt = require('../main');

if ( ! action || action.match(/^\-\-/) ) {
  action = 'json';
}

args.forEach(function (arg, i) {
  if ( arg.match(/^\-\-/) ) {
    switch ( arg.replace(/^\-\-/, '') ) {
      case 'base':
        if ( args[(i + 1)] && ! args[(i + 1)].trim().match(/^\-\-/) ) {
          apt.set({ base: args[(i + 1)].trim() });
        }
        break;
    }
  }
});

switch ( action ) {
  case 'json':
  case 'help':
    apt[action]()
      .on('error', function (error) {
        console.error(error.toString().red);
      })
      .on('done', function (data) {
        console.log(JSON.stringify(data, null, 2));
      });
    break;
}