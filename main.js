module.exports = require('lib-import')
  .$$setPath(__dirname)
  .$$setProperty({ base: process.cwd() });