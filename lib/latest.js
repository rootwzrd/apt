var latest = function ($module, then) {
	if ( typeof $module !== 'object' || typeof $module.latest !== 'object' ) {
    return then(new Error('Latest not found'));
  }
  var latest = $module.latest.dynamic,
    method = Object.keys(latest)[0];
  switch ( method ) {
    case 'scrape':
      require('./scrape')({
          from: latest.scrape.from,
          search: latest.scrape.search,
          extract: latest.scrape.extract
        },
        function (err, latest) {
          if ( err ) then(err);
          else {
            then(null, latest);
          }
        }
    );
  }
};

module.exports = latest;