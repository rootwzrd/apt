require('colors');

var onMessage = function (message, prefix) {
 var level = Object.keys(message)[0],
  log = message[level],
  color;
  switch ( level ) {
    default:
      color = 'grey';
      break;
    case 'error':
      color = 'red';
      break;
    case 'ok':
      color = 'green';
      break;
    case 'warning':
      color = 'yellow';
      break;
  }
  var args = [];
  if ( prefix instanceof Array ) {
    args = args.concat(prefix);
  }
  args.push(log[color].italic);
  if ( message.debug ) {
    args.push(message.debug);
  }
  console.error.apply(null, args);
  return {
    message: log,
    debug: message.debug || {},
    level: level
  };
};

module.exports = onMessage;