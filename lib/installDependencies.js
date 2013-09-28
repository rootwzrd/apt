var installDependencies = function (module) {
  var dependencies = module.store.dependencies || {};
  if ( ! Object.keys(dependencies).length ) {
    this.emit('message', 'This module has no dependencies');
    return this.emit('done', []);
  }
};

module.exports = function (module) {
  var interface = require('./interface');
  return new interface(installDependencies, [module]);
};