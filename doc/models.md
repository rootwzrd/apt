apt
======

apt is an installer for Linux. apt does not require root privileges to install software. Also, apt can run in parallel different versions of the same software.

# Lab

## Module

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

## Latest

How to find module's latest version. Expects one of the following:

 - scrape

## Expose

How to get all distributed versions from module. Expects one of the following:

 - scrape
 - json

## Download

Expects one of the following:

 - github

## Scrape

    {
      "from": String, // URL
      "search": RegExp, // Regular Expression
      "extract": Number, // What to extrcat from regular expression
    }

## Github

    {
        "vendor": String,
        "repo": String,
        "prefix": String
    }

## JSON

    {
      "from": String,
      "select": String,
      "filter": Array
    }