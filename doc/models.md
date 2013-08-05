apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Model: Lab/module

    {
        "name": String, // The name of the module
        "latest": Object, // Latest
        "expose": Object, // Expose
        "install": {
            "semantic version": { // The versions for which to use this installation process
                "download": Object, // Download
                "build": Array // The build instructions a-la-Travis
            }
        }
    }
