apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Command Line Interface

## List modules installed on my station

    $ apt station
        ⇾ JSON Array [ JSON Object #model.station.module {} ]
    
## List modules from the lab

    $ apt lab
        ⇾ JSON Array [ JSON Object #model.lab.module {} ]
    
## Get a module latest version

    $ apt latest <module>
        ⇾ JSON Object {<version>: <shasum>}
    
## Expose all module versions

    $ apt versions <module>
        ⇾ JSON Array [ JSON Object {<version>: <shasum>} ]
    
## Resolve a module semantic version

    $ apt version <module> <semantic version>
        ⇾ JSON Object {<version>: <shasum>}
    
## Install a module

    $ apt install <module> [latest | <release> | <semantic version>]
        ⇾ JSON Object #model.lab.module {}
