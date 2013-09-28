function apt.installNode() {
  local node_version=0.10.19;
  local source=https://github.com/joyent/node/archive/v"$node_version".tar.gz;

  mkdir ~/.apt ||
    return 1;

  mkdir ~/.apt/.sources ||
    return 2;

  cd ~/.apt/.sources;

  # wget -O node-"$node_version".tar.gz $source ||
  #   return 10;

  tar -xzf node-"$node_version".tar.gz ||
    return 11;

  cd node-"$node_version" ||
    return 13;

  ./configure --prefix=$HOME/.apt/node/$node_version ||
    return 14;

  make ||
    return 15;

  make install ||
    return 16;

  make clean ||
    return 17;

  ~/.apt/node/$node_version/bin/npm install -g git+https://github.com/co2-git/apt.git ||
    return 18;

  apt && {
    echo 'apt installed with node';
  } || {
    return 19;
  }
}

apt.installNode "$@";
exit $?;