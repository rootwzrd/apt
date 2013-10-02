gcc_version=4.8.1;
isl_version=0.11.1;
cloog_version=0.18.0;

if [ ! -d ~/.apt ]; then
	mkdir ~/.apt;
fi

if [ ! -d ~/.apt/.sources ]; then
  mkdir ~/.apt/.sources;
fi

if [ ! -d ~/.apt/.var ]; then
  mkdir ~/.apt/.var;
fi

# cd ~/.apt/.sources;
# wget -O isl-$isl_version.tar.bz2  ftp://gcc.gnu.org/pub/gcc/infrastructure/isl-0.11.1.tar.bz2;
# tar -xjf isl-$isl_version.tar.bz2;
# cd isl-$isl_version;
# ./configure --prefix=$HOME/.apt/isl/$isl_version;
# make;
# make install;
# rm -rf ~/apt/.sources/isl-$isl_version;


# cd ~/.apt/.sources;
# wget -O cloog-"$cloog_version".tar.gz  ftp://gcc.gnu.org/pub/gcc/infrastructure/cloog-"$cloog_version".tar.gz;
# tar -xzf cloog-"$cloog_version".tar.gz;
# cd cloog-"$cloog_version";
# ./configure --prefix=$HOME/.apt/cloog/"$cloog_version";
# make;
# make install;
# rm -rf ~/apt/.sources/cloog-$cloog_version;


cd ~/.apt/.sources;
# wget -O gcc-$gcc_version.tar.xzf ftp://ftp.fu-berlin.de/unix/languages/gcc/releases/gcc-$gcc_version/gcc-$gcc_version.tar.gz;
# tar -xzf gcc-$gcc_version.tar.gz;
cd gcc-$gcc_version;
contrib/download_prerequisites;
mkdir ~/.apt/.var/gcc-objdir;
cd ~/.apt/.var/gcc-objdir;
$PWD/../../.sources/gcc-$gcc_version/configure \
  --prefix=$HOME/.apt/gcc/$gcc_version \
  # --with-isl=$HOME/.apt/isl/$isl_version/lib \
  # --with-cloog=$HOME/.apt/cloog/$cloog_version/bin \
  # --with-isl=system \
  --with-bits=gmp;
make -j 2;
make check;
make install;