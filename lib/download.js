var convert = function (num) {
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
};

var download = function (from, to, then) {
  this.emit('message', 'downloading', { from: from, to: to });
  
  require('request-progress')(
    require('request')(from))
      .on('progress', function (state) {
        var divider, unit, total = convert(state.total);
        process.stdout.write("Downloaded " + convert(state.received) + '/' +
          total + ' - ' + state.percent + " %                    \r");
      }.bind(this))
      
      .on('error', function (error) {
        this.emit('error',
          this.emit('message', { 'error': 'HTTP failed' }, error).debug.error);
      }.bind(this))
      
      .on('close', function (code) {
        console.log('1st close');
          console.log(arguments);
      }.bind(this))
      
      .pipe(require('fs').createWriteStream(to))
        .on('error', function (error) {
          this.emit('error',
            this.emit('message', { 'error': 'Stream failed' }, error).debug.error);
        }.bind(this))
        
        .on('close', function (code) {
          this.emit('done');
        }.bind(this));
};

module.exports = function () {
  var interface = require('./interface');
  return new interface(download, arguments);
};