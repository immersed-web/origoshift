
#!/bin/bash

# Hello! This is a nice utility file. You can get access to the functions in here by calling `source utility.sh` from within your shell scripts.
# The calling script should have its cwd set to the location of utility.sh for the source command to find it

# Functions to display commands
stage() {
  printf '\n\n'
  print_hline
  printf "| $@ \n";
  print_hline
  printf '\n';
}
say() {
  # echo '';
  printf '\n%*s----\n' "${#1}" '' | tr ' ' -
  echo "| $@ |" ;
  echo '';
}
exe() { echo "\$ $@" ; "$@" ; }


print_hline() {
  printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' =
}

cd $(dirname $BASH_SOURCE)
SCRIPTDIR=$(pwd)
cd ..
PROJECTDIR=$(pwd)

cd_to_script() {
  say 'Changing directory to script folder'
  cd $SCRIPTDIR
}

cd_to_project_root() {
  say 'Changing directory to project root'
  cd $PROJECTDIR
}
