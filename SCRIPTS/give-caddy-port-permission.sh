if [[ $(id -u) -ne 0 ]] ; then
    echo "Please run as root"
    echo 'This script runs a bunch of stuff that requires privileges in order to configure the environment'
    exit
fi

say() { echo "\$ $@" ;}
exe() { echo "\$ $@" ; "$@" ; }


say 'We now give caddy permission to bind to lower number ports. This is so caddy can listen on port 80 and 443'
exe sudo setcap CAP_NET_BIND_SERVICE=+eip $(which caddy)