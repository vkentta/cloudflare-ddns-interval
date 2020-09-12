const publicIp = require('public-ip');
const cloudflare = require('cloudflare');

let previousServerIp;

const MS_IN_MIN = 1000 * 60;

async function updateDnsRecordsPeriodically(config) {
    const clouflareAPI = cloudflare(config.cloudflare);
    const domains = await getDomainsWithIDs(clouflareAPI, config.domains);
    updateDnsRecordsIfIpHasChanged(clouflareAPI, domains);

    setInterval(() => updateDnsRecordsIfIpHasChanged(clouflareAPI, domains), config.checkPeriodMinutes * MS_IN_MIN);
}

async function getDomainsWithIDs(clouflareAPI, configDomains) {
    const response = await clouflareAPI.zones.browse();
    const configuredDomains = response.result.filter(domain => configDomains.includes(domain.name));
    const configuredDomainsWithIDs = configuredDomains.map(domain => ({name: domain.name, id: domain.id}));
    return configuredDomainsWithIDs;
}

async function updateDnsRecordsIfIpHasChanged(clouflareAPI, domains) {
    const currentServerIp = await publicIp.v4();
    if (serverIpHasChanged(currentServerIp)) {
        if (previousServerIp === undefined) {
            console.log('First iteration with no IP history...');
            console.log(`Current IP: ${currentServerIp}`);
        } else {
            console.log(`IP change detected (${previousServerIp} -> ${currentServerIp})...`);
        }
        console.log(`IP updated on: ${(new Date()).toISOString()}`);
        previousServerIp = currentServerIp;
        domains.forEach(async domain => {
            await updateDNSRecordIfIpDoesNotMatch(clouflareAPI, domain, currentServerIp);
        });
    }
}

function serverIpHasChanged(currentServerIp) {
    return previousServerIp !== currentServerIp;
}

async function updateDNSRecordIfIpDoesNotMatch(clouflareAPI, domain, currentServerIp) {
    const DNSRecord = await getTypeADNSRecodForDomain(clouflareAPI, domain);
    console.log(`Checking ${domain.name} ...`);
    if (DNSRecord.content !== currentServerIp) {
        console.log('Updating DNS record');
        console.log(`${DNSRecord.content} -> ${currentServerIp}`);
        console.log('...');
        const response = await updateDNSRecord(clouflareAPI, domain, DNSRecord, currentServerIp);
        if (response.success) {
            console.log('Done');
        } else {
            console.log('Failed');
        }
    } else {
        console.log('Up to date');
    }
}

async function getTypeADNSRecodForDomain(clouflareAPI, domain) {
    const response = await clouflareAPI.dnsRecords.browse(domain.id);
    const typeADNSRecord = response.result.find(DNSRecord => DNSRecord.type === 'A' && DNSRecord.name === domain.name);
    return typeADNSRecord;
}

async function updateDNSRecord(clouflareAPI, domain, DNSRecord, currentServerIp) {
    const updatedDNSRecord = {
        ...DNSRecord,
        content: currentServerIp,
    };
    const response = await clouflareAPI.dnsRecords.edit(domain.id, DNSRecord.id, updatedDNSRecord);
    return response;
}

module.exports = updateDnsRecordsPeriodically;
