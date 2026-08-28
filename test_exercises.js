// Test script to verify AI workout generation
const exercisesData = require('./assets/exercises.json');

console.log('Total exercises in database:', exercisesData.length);

// Test getExerciseById function
const getExerciseById = (id) => {
    const ex = exercisesData.find((e) => e.id === id || e.id.toString() === id);
    if (!ex) {
        console.log(`  ❌ Exercise ID ${id} NOT FOUND`);
        return null;
    }
    console.log(`  ✅ Exercise ID ${id} found: ${ex.name}`);
    return {
        id: ex.id.toString(),
        name: ex.name,
        image_url: ex.image_url,
        video_url: ex.video_url,
        body_parts: ex.body_parts || [],
        equipment: ex.equipment || []
    };
};

console.log('\n--- Testing Exercise IDs ---');
const testIds = ['2', '18', '105', '145', '107', '6', '136'];
const exercises = testIds.map(getExerciseById).filter(e => e !== null);

console.log(`\nFound ${exercises.length} out of ${testIds.length} exercises`);
console.log('\nExercises:', exercises.map(e => e.name).join(', '));
