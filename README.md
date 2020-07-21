# cloudflare-ddns-interval

Update cloudflare DNS records to match server IP for list of domains.

Software periodically checks if the host IP has changed and if it has, it updates the DNS (A) records to point to the new IP.

### Requirements:
* Node.js
* ``config.json`` file based on ``example.config.json``

### Running:

``npm install``

``npm start``