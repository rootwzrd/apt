var download = function (from, to, then) {
  console.log('downloading ' + from);
  require('request-progress')(require('request')(from))
    .on('progress', function (state) {
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
        then(err);
    })
    .on('close', function (code) {
      console.log('1st close');
        console.log(arguments);
    })
    .pipe(require('fs').createWriteStream(to))
      .on('error', function (err) {
        then(err);
      })
      .on('close', function (code) {
        then(null);
      });
};

module.exports = download;