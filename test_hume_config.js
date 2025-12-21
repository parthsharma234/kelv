import { config } from 'dotenv';
import https from 'https';

// Load env vars (simulated since we can't load .env directly in this script context easily without setup)
// I will read the .env file content in the next step to get the keys
// For now, I'll assume I can pass them or read them.
// Actually, I'll just use the values from the user's environment if I can access them.
// I'll write a script that reads .env

const API_KEY = process.env.VITE_HUME_API_KEY || 'REDACTED';
const CONFIG_ID = process.env.VITE_HUME_CONFIG_ID || '6e4b4a00-92e4-47b9-80da-e5316b6cca2f';

if (API_KEY === 'REDACTED') {
    console.error("Please set VITE_HUME_API_KEY");
    process.exit(1);
}

const options = {
    hostname: 'api.hume.ai',
    path: `/v0/evi/configs/${CONFIG_ID}`,
    method: 'GET',
    headers: {
        'X-Hume-Api-Key': API_KEY
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const config = JSON.parse(data);
            console.log("Config fetched successfully!");
            if (config.prompt && config.prompt.text) {
                console.log("Prompt text found:", config.prompt.text.substring(0, 50) + "...");
            } else {
                console.log("Prompt text NOT found in config object.");
                console.log("Config keys:", Object.keys(config));
            }
        } else {
            console.error(`Failed to fetch config: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
