apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Command Line Interface

## List modules installed in project

    $ apt view
    $ apt view name=mysql
    $ apt view type=database-server
    
## List modules from the store

    $ apt search
    $ apt search name=mysql
    $ apt search type=database-server
    
## Install a module

    $ apt install <module>@<version>
