if [ $(id -u) -ne 0 ]
  then
    echo "Please run as root"
    echo 'This script runs stuff that requires higher privileges in order to configure the environment'
    exit
fi

BASEDIR=$(dirname $BASH_SOURCE)
cd $BASEDIR
source utility.sh

say 'We now give caddy server permission to bind to lower number ports. This is so caddy can listen on port 80 and 443'
exe setcap CAP_NET_BIND_SERVICE=+eip $(which caddy)
