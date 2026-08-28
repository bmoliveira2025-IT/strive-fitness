const https = require('https');

const key = 'AIzaSyDtZ4JGlfo7zYV7kEIAdSkjSYPoznkN-Hw';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Valid Models:");
                json.models.forEach(m => console.log(m.name));
            } else {
                console.log("No models found or error:", data);
            }
        } catch (e) {
            console.log("Raw output:", data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
