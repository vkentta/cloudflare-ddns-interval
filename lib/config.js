const fs = require('fs');
let config;

try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch(_) {
    console.error('Could not read config.json!');
    console.error('Create one based on example.config.json\n');
    process.exit(1);
}

module.exports = config;