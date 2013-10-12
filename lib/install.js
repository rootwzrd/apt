var modules = [{
    name: null,
    version: null,
    cwd: process.cwd()
  }],
  $module = modules[0],
  AptJson,
  $installed = [],
  all = 0,
  apt = require('../main'),
  self;

function createAptJsonIfNotExist (module) {
  self.emit('message', { 'minor': 'Check for apt.json' });
  if ( ! AptJson.FileExists ) {
    self.emit('message', { 'warning': 'no apt.json' }, AptJson.File);
    self.emit('message', 'Creating apt.json', AptJson.File);
    return AptJson.init(function (error) {
      if ( error ) {
        return self.emit('error',
          self.emit('message', { 'error': 'Could not create apt.json' }, error).debug);
      }
      self.emit('message', { 'ok': 'apt.json created' });
      if ( ! module.path ) {
          module.path = AptJson.Path;
        }
      verifyIfModuleNotAlreadyInstalled(module);
    });
  }
  self.emit('message', { 'minor': 'apt.json found' });
  verifyIfModuleNotAlreadyInstalled(module);
}

function verifyIfModuleNotAlreadyInstalled (module) {
  self.emit('message', { 'minor': 'Check dependency not already installed' });
  AptJson.get({ name: module.name }, function (error, modules) {
    if ( error ) {
      self.emit('message', { 'error': 'Could not read Apt.Json' }, error);
      return self.emit('error', error);
    }
    
    if ( modules.length ) {
      return self.emit('error', new Error('Dependency already installed'));
    }
    
    self.emit('message', { 'minor': 'Dependency not already installed' });
    installDependencies(module);
  });
}

function installDependencies (module) {
  self.emit('message', { 'minor': 'Install dependency\'s dependencies first' });
  
  apt.load('installDependencies', module)
    .on('message', apt.message)
    
    .on('error', function (error) {
      self.emit('message', { 'error': 'Could not install dependencies' }, error);
      self.emit('error', error);
    })

    .on('done', function (dependencies) {
      if ( dependencies.length ) {
        self.emit('message', { 'ok': 'dependencies installed' });
      }
      
      downloadTarball(module);
    });
}

function downloadTarball (module) {
  apt.load('downloadTarball', module)
    .on('message', apt.message)

    .on('error', function (error) {
      self.emit('message', { 'error': 'Could not download tarball' }, error);
      self.emit('error', error);
    })

    .on('done', function () {
      extractTarball(module);
    });
}

function extractTarball (module) {
  apt.load('extractTarball', module)
    .on('message', apt.message)

    .on('error', function (error) {
      self.emit('message', { 'error': 'Could not extract tarball' }, error);
      self.emit('error', error);
    })

    .on('done', function () {
      buildSource(module);
    });
}

function buildSource (module) {
  apt.load('buildSource', module)
    .on('message', apt.message)

    .on('error', function (error) {
      self.emit('message', { 'error': 'Could not build source' }, error);
      self.emit('error', error);
    })

    .on('done', function () {
      self.emit('message', { 'ok': 'Source built' });
      updateAptJson(module);
    });
}

function updateAptJson (module) {
  AptJson.insert({ name: module.name, version: module.version }, function (error) {
    if ( error ) {
      self.emit('message', { 'error': 'Could not update Apt.Json' }, error);
      return self.emit('error', error);
    }
    
    self.emit('message', { 'ok': 'Apt.Json updated' });
    installed(module);
  });
}

function installed (module) {
  $installed.push(module);
  if ( $installed.length === all ) {
    self.emit('done', $installed);
  }
}






module.exports = function install (module, config) {
  self = this;

  self.emit('message', { 'minor': 'Installing dependencies' }, module);

  switch ( typeof module ) {
    case 'string':
      var id = module.split('@');
      $module.name = id[0];
      if ( id[1] ) {
        $module.version = id[1];
      }
      break;
  }

  if ( typeof config !== 'object' ) {
    config = {};
  }

  self.emit('message', { 'minor': 'Installing dependencies' }, { module: $module, config: config });

  if ( ! $module.name ) {
    return self.emit('error', new Error(
      self.emit('message', { 'error': 'Missing module name', 'debug': $module }).message));
  }

  if ( ! $module.version ) {
    self.emit('message', { 'warning': 'No version requested -- will use latest' });
  }

  /* Searching store */
  apt.load('search', $module)
    .on('message', apt.message)

    .on('error', function (error) {
      self.emit('error', self.emit('message', { 'error': 'Store error' }, error).debug);
    })

    .on('done', function (storedModules) {
      if ( ! storedModules instanceof Array ) {
        return self.emit('error', new Error(
          self.emit('message', { 'error': 'Store response error' }).message));
      }

      if ( ! storedModules.length ) {
        return self.emit('error', new Error(
          self.emit('message', { 'error': 'No such module in store' }, $module).message));
      }

      var forEachModule = function (storedModule) {
        var thisModule = {
            name: storedModule.name,
            version: $module.version,
            dependencies: {},
            cwd: config.cwd || $module.cwd,
            path: config.path,
            install: null
          };
        
        /* If no version declared, use latest */
        
        if ( ! thisModule.version ) {
          thisModule.version = storedModule.latest;
        }
        
        self.emit('message', { 'minor': 'Version set to ' + thisModule.version });

        /* Make sure version is supported */

        if ( storedModule.versions.indexOf(thisModule.version) === -1 ) {
          return self.emit('error', new Error(
            self.emit('message', { 'error': 'Version not suppored' }, thisModule.version).message));
        }

        /* Get semantic version module */

        var semver = new (require('./semver'))(thisModule.version);

        /* Find install how-to */

        for ( var semantic in storedModule.install ) {
          if ( semver.match(semantic) ) {
            thisModule.install = storedModule.install[semantic];
            break;
          }
        }

        if ( ! thisModule.install ) {
          return self.emit('error', new Error(
            self.emit('message', { 'error': 'How to install not found' },
              { candidates: Object.keys(storedModule.install) }).message));
        }

        /* Find dependencies */

        for ( semantic in storedModule.dependencies ) {
          if ( semver.match(semantic) ) {
            thisModule.dependencies = storedModule.dependencies[semantic];
            break;
          }
        }
        
        AptJson = new (require('./AptJson'))(thisModule.cwd);
        
        if ( AptJson.FileExists ) {
          if ( ! thisModule.path ) {
            thisModule.path = AptJson.Path;
          }
        }

        self.emit('message', 'Installing dependency', thisModule);

        createAptJsonIfNotExist(thisModule);
      };

      all = storedModules.length;

      storedModules.forEach(forEachModule);
    });
};