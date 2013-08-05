apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Command Line Interface

## List modules installed on my station

    apt station
    
## List modules from the lab

    apt lab
    
## Get a module latest version

    apt latest <module>
    
## Expose all module versions

    apt versions <module>
    
## Resolve a module semantic version

    apt version <module> <semantic version>
    
## Install a module

    apt install <module> [latest | <release> | <semantic version>]
