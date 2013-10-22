# Get folder status

  $ apt
  
Basically, you want to issue this command inside the project folder to see if `apt` is present there to some degree.
If there is a file in the project folder called `apt.json`, this command will display the contents it. The `apt.json` offers necessary information to the status of `apt` in this folder. See `doc/aptjson.md` for more information on this file. If no `apt.json` file is found, no output is generated.

Exit status for this command:

 - 0  `apt.json` exists and its content output
 - 1  no `apt.json` found
