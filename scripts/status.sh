#!/bin/bash
#
# This script is executed by the Settings window to obtain
# system server status.
sshPort=$1
private_key="$(pwd)/../security/ssh/debian_rsa"
cache_key="$(pwd)/../cache_key"

# Check if keys synched, copy to cache
if [ -f "$private_key" ]; then
    cp "$private_key" "$cache_key"
    chmod 600 "$cache_key"
fi
if [ -f "$cache_key" ]; then   
    ssh -q -o StrictHostKeyChecking=no -i "$cache_key" -p "$sshPort" debian@local.dev.cc /usr/sbin/service --status-all
else
    echo "No cache key found for status"
    exit 1
fi
