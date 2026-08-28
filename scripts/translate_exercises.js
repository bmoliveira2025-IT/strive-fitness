const fs = require('fs');
const path = require('path');
const https = require('https');

const EXERCISES_PATH = path.join(__dirname, '../assets/exercises.json');
const GEMINI_API_KEY = 'AIzaSyCZC0UdP9Po1nEgzt83lf6IaLdNeeCTUWc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Load exercises
const exercises = require(EXERCISES_PATH);
console.log(`Loaded ${exercises.length} exercises.`);

// Dictionary for common titles to save Token usage / increase accuracy
const TITLE_MAP = {
    "Barbell Bench Press": "Supino Reto com Barra",
    "Dumbbell Bench Press": "Supino com Halteres",
    "Incline Bench Press": "Supino Inclinado",
    "Push Up": "Flexão de Braço",
    "Squat": "Agachamento",
    "Deadlift": "Levantamento Terra",
    "Pull Up": "Barra Fixa",
    "Chin Up": "Barra Fixa Supinada",
    "Lateral Raise": "Elevação Lateral",
    "Bicep Curl": "Rosca Direta",
    "Tricep Extension": "Extensão de Tríceps",
    "Leg Press": "Leg Press",
    "Leg Extension": "Cadeira Extensora",
    "Leg Curl": "Cadeira Flexora",
    "Calf Raise": "Elevação de Panturrilha",
    "Plank": "Prancha",
    "Crunch": "Abdominal",
    "Russian Twist": "Rotação Russa",
    "Shoulder Press": "Desenvolvimento de Ombros",
    "Overhead Press": "Desenvolvimento Militar",
    "Front Raise": "Elevação Frontal",
    "Face Pull": "Face Pull",
    "Dips": "Mergulho",
    "Lunges": "Avanço",
    "Bulgarian Split Squat": "Agachamento Búlgaro"
};

// Queue management
const BATCH_SIZE = 15; // Process 15 exercises at a time to stay within limits
let processedCount = 0;

async function callGemini(batch) {
    const prompt = `Translate the following gym exercises to Portuguese (pt-BR).
    
    Format must be a JSON object where keys are the exercise IDs and values are objects with:
    - "name": Translated name in Portuguese (Keep distinct variations accurately)
    - "description": Motivational description in Portuguese
    - "instructions": Array of strings with step-by-step instructions in Portuguese (Imperoative mood)
    - "tips": Array of strings with tips in Portuguese
    
    Input JSON:
    ${JSON.stringify(batch.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        instructions: e.instructions,
        tips: e.tips
    })))}

    Respond ONLY with the VALID JSON output. Do not include markdown formatting.`;

    return new Promise((resolve, reject) => {
        const req = https.request(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error('API Error:', data);
                    reject(new Error(`API Error ${res.statusCode}`));
                    return;
                }
                try {
                    // Clean markdown if present
                    let cleanData = data.toString().replace(/```json/g, '').replace(/```/g, '').trim();
                    const json = JSON.parse(cleanData);
                    resolve(json);
                } catch (e) {
                    console.error('Parse Error for chunk:', cleanData.substring(0, 100));
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        }));
        req.end();
    });
}

// Check for existing translations or restart
// For this task, we will try to translate the first 50 most popular/common ones + the one the user complained about
// Filtering for exercises that look like they need translation (English text)
const needsTranslation = exercises.filter(e => {
    // Simple heuristic: check if description contains "The" or instructions contain "Hold"
    const desc = e.description || "";
    const instr = (e.instructions || []).join(" ");
    return desc.includes("The ") || instr.includes("Hold ") || instr.includes("Stand ");
});

console.log(`Found ${needsTranslation.length} exercises needing translation.`);

// Process ALL exercises
const targetBatch = needsTranslation; // Process everyone
console.log(`Starting translation for ${targetBatch.length} exercises... this may take a while.`);

async function processQueue() {
    const totalBatches = Math.ceil(targetBatch.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
        const batchLines = targetBatch.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        console.log(`Processing batch ${i + 1}/${totalBatches}...`);

        try {
            const translations = await callGemini(batchLines);

            // Apply translations
            Object.keys(translations).forEach(id => {
                const translation = translations[id];
                const exerciseIndex = exercises.findIndex(e => e.id == id);
                if (exerciseIndex !== -1) {
                    exercises[exerciseIndex].name = translation.name || exercises[exerciseIndex].name;
                    exercises[exerciseIndex].description = translation.description || exercises[exerciseIndex].description;
                    exercises[exerciseIndex].instructions = translation.instructions || exercises[exerciseIndex].instructions;
                    exercises[exerciseIndex].tips = translation.tips || exercises[exerciseIndex].tips;
                    // Tag it as translated manually if we want
                }
            });

            processedCount += batchLines.length;

        } catch (e) {
            console.error('Batch failed:', e.message);
        }

        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 1000));
    }

    // Save back
    fs.writeFileSync(EXERCISES_PATH, JSON.stringify(exercises, null, 2));
    console.log('Done! Updated exercises.json');
}

processQueue();
