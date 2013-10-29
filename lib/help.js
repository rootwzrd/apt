module.exports = function help () {
  this.emit('done', {
    'view apt in current folder': {
      cli: 'apt',
      script: "apt.json()"
    },
    'view apt in a given folder': {
      cli: 'apt --base /my/directory',
      script: "apt.set({ base: '/my/directory' }).json()"
    },
    'view help': {
      cli: 'apt help',
      script: "apt.help()"
    },
    'run test': {
      cli: 'npm test apt'
    }
  });
};