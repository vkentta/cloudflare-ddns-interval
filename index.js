const config = require('./lib/config');
const updateDnsRecordsPeriodically = require('./lib/cloudflare-ddns');

updateDnsRecordsPeriodically(config);