#!/bin/bash

docker run\
    -d \
    -v $(pwd)/config.json:/usr/src/app/config.json \
    --name cloudflare-ddns-interval \
    --restart unless-stopped \
    vkentta/cloudflare-ddns-interval