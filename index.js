let config;
try {
    config = require('./config');
} catch(e) {
    console.error('File config.js missing!');
    console.error('Create one based on example.config.js\n');
    process.exit(1);
}

const publicIp = require('public-ip');
const cloudflare = require('cloudflare');

const clouflareAPI = cloudflare(config.api);
let previousServerIp;
let lastIpUpdateDate = (new Date()).toISOString();
let ipCheckCount = 0;

const MS_IN_MIN = 1000 * 60;
const CHECK_PERIOD = MS_IN_MIN * 5;
const LOG_PERIOD = MS_IN_MIN * 60 * 24 * 7;

updateDnsRecordsPeriodically();
logIpCheckStatusPeriodically();

async function updateDnsRecordsPeriodically() {
    const domains = await getDomainsWithIDs(config.domains);
    updateDnsRecordsIfIpHasChanged(domains);

    setInterval(() => updateDnsRecordsIfIpHasChanged(domains), CHECK_PERIOD);
}

async function getDomainsWithIDs(configDomains) {
    const response = await clouflareAPI.zones.browse();
    const configuredDomains = response.result.filter(domain => configDomains.includes(domain.name));
    const configuredDomainsWithIDs = configuredDomains.map(domain => ({name: domain.name, id: domain.id}));
    return configuredDomainsWithIDs;
}

async function updateDnsRecordsIfIpHasChanged(domains) {
    const currentServerIp = await publicIp.v4();
    ipCheckCount++;
    if (serverIpHasChanged(currentServerIp)) {
        lastIpUpdateDate = (new Date()).toISOString();
        if (previousServerIp === undefined) {
            console.log('First iteration with no IP history...');
            console.log(`Current IP: ${currentServerIp}`);
        } else {
            console.log(`IP change detected (${previousServerIp} -> ${currentServerIp})...`);
        }
        previousServerIp = currentServerIp;
        domains.forEach(async domain => {
            await updateDNSRecordIfIpDoesNotMatch(domain, currentServerIp);
        });
    }
}

function serverIpHasChanged(currentServerIp) {
    return previousServerIp !== currentServerIp;
}

async function updateDNSRecordIfIpDoesNotMatch(domain, currentServerIp) {
    const DNSRecord = await getTypeADNSRecodForDomain(domain);
    console.log(`Checking ${domain.name} ...`);
    if (DNSRecord.content !== currentServerIp) {
        console.log('Updating DNS record');
        console.log(`${DNSRecord.content} -> ${currentServerIp}`);
        console.log('...');
        const response = await updateDNSRecord(domain, DNSRecord, currentServerIp);
        if (response.success) {
            console.log('Done');
        } else {
            console.log('Failed');
        }
    } else {
        console.log('Up to date');
    }
}

async function getTypeADNSRecodForDomain(domain) {
    const response = await clouflareAPI.dnsRecords.browse(domain.id);
    const typeADNSRecord = response.result.find(DNSRecord => DNSRecord.type === 'A' && DNSRecord.name === domain.name);
    return typeADNSRecord;
}

async function updateDNSRecord(domain, DNSRecord, currentServerIp) {
    const updatedDNSRecord = {
        ...DNSRecord,
        content: currentServerIp,
    };
    const response = await clouflareAPI.dnsRecords.edit(domain.id, DNSRecord.id, updatedDNSRecord);
    return response;
}

function logIpCheckStatusPeriodically() {
    setInterval(logIpCheckStatus, LOG_PERIOD);
}

function logIpCheckStatus() {
    console.log(`IP updated last time on: ${lastIpUpdateDate}, total check count: ${ipCheckCount}`);
}
