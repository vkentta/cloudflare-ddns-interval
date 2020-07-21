# cloudflare-ddns-interval

Update cloudflare DNS records to match server IP for list of domains.

Software periodically checks if the host IP has changed and if it has, it updates the DNS (A) records to point to the new IP.

### Requirements:
* Docker / Node.js
* ``config.json`` file based on ``example.config.json``

### Running (Docker):

Within a directory containing the ``config.json`` file

```
docker run\
    -d \
    -v $(pwd)/config.json:/usr/src/app/config.json \
    --name cloudflare-ddns-interval \
    --restart unless-stopped \
    vkentta/cloudflare-ddns-interval
```

### Running (Node.js):

Within a clone of this repo:

``npm install``

``npm start``