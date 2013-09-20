var scrape = function (scraper, then) {
  var from = scraper.from,
    flags = '',
    group = scraper.group && scraper.group,
    extract = scraper.extract;
  if ( group ) {
    flags += 'g';
  }
  var regex = new RegExp(scraper.search, flags);
  require('request')(from,
    function (err, headers, data) {
      if ( err ) {
        console.log(err);
        then(err);
      }
      else {
        var matches = data.match(regex);
        if ( ! matches || ! matches[extract] ) {
          then(new Error('Scrape failed - no match found!'));
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

module.exports = scrape;