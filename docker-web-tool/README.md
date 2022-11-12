# Docker webdev tool

A web development tool based on bash using the Docker

Docker-webdev is a web development tool for localhost machine,
based on a little bash script for a Linux Desktop or command
line of Unix systems. It starts a few containers based on
YAML configuration and the docker-compose.

The purpose of that tool is facilitating daily start/stop
the same processes of web development without cluttering up
the host machine with various files.

Under the hood: [MySQL](https://hub.docker.com/_/mariadb/) + [Nginx](https://hub.docker.com/_/nginx/) + [PhpMyAdmin](https://hub.docker.com/r/phpmyadmin/phpmyadmin/) + [PHP-FPM](https://hub.docker.com/_/php/)
serving various port/socket data transfer methods.

### Directory Structure

```bash
webdev
├─ app
│  ├─ conf          # Config files (as nginx, php etc)
│  ├─ database      # MySQL files
│  ├─ logs          # Nginx logs
│  ├─ run           # Directory for php-fpm socket
│  └─ www           # Php files
│
├─ README.md
├─ webdev           # Bash script
├─ webdev.desktop   # Launcher in the desktop
├─ webdev.png       # Desktop icon
├─ webdev-port.yml  # Docker config using php-fpm port
└─ webdev-sock.yml  # Docker config using php-fpm socket
```

### Desktop Entries

There are many different Linux distributions that have a different directory structure.
So you have to find out the desktop entry of your distribution before the project init's
and change the directories in a bash script.

I use the [Archlinux](https://www.archlinux.org/) + [Gnome](https://wiki.archlinux.org/index.php/GNOME) on my home PC.
The webdev will copy few files to the Linux [desktop entries](https://wiki.archlinux.org/index.php/desktop_entries).

```
~/work/webdev/webdev         => /usr/local/bin/webdev
~/work/webdev/webdev.png     => /usr/share/pixmaps/webdev.png
~/work/webdev/webdev.desktop => /usr/share/applications/webdev.desktop
```

### Usage:

```bash
# Usage: webdev {up|down|import|conf|cdesk|idesk|rdesk}

$ webdev up {port|socket}
# Builds, (re)creates, starts, and attaches to containers for a service.
# Use second parameter to choose php-fpm method (socket as default).

$ webdev down
# Stops and removes containers, networks, volumes, and images created by up.

$ webdev import db_name /path/dump.sql
# Imports database from a dump file.

$ webdev conf
# Validates and view for the current yaml configuration.

$ webdev idesk
# Shows an information about the copied files into a desktop entry.

$ webdev rdesk
# Removes the copied files from the bin directory and desktop entry.

$ webdev cdesk
# Copies files below to a bin directory and desktop entry.
# After that you can run/stop the docker services using your desktop entry.
#
#  ./webdev         => /usr/local/bin/webdev
#  ./webdev.png     => /usr/share/pixmaps/webdev.png
#  ./webdev.desktop => /usr/share/applications/webdev.desktop
```
