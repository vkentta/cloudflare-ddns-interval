# cloudflare-ddns-interval

Update cloudflare DNS records to match server (dynamic) IP for given domains.

Software periodically (every 5min) checks if the host IP has changed and if it has, it updates the DNS records to point to the new IP.

### Requirements:
* Node.js
* ``config.js`` file based on ``example.config.js``

### Running:

``npm install``

``npm start``