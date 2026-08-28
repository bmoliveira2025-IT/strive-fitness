import json
import re
from deep_translator import GoogleTranslator
import time

INPUT_FILE = r'c:\Users\braul\.gemini\antigravity\scratch\gym_app\mobile_app\assets\exercises.json'
OUTPUT_FILE = r'c:\Users\braul\.gemini\antigravity\scratch\gym_app\mobile_app\assets\exercises_translated.json'

# Body Part Mapping
BODY_PART_MAP = {
    'Back': 'Costas',
    'Biceps': 'Bíceps',
    'Calves': 'Panturrilhas',
    'Cardio': 'Cardio',
    'Chest': 'Peito',
    'Forearms': 'Antebraços',
    'Hamstrings': 'Isquiotibiais',
    'Hips': 'Quadris',
    'Neck': 'Pescoço',
    'Quadriceps': 'Quadríceps',
    'Shoulders': 'Ombros',
    'Thighs': 'Coxas',
    'Triceps': 'Tríceps',
    'Upper Arms': 'Braços',
    'Waist': 'Cintura',
    'Abdominais': 'Abdominais',
    'Abs': 'Abdominais',
    # Add any others found or default to original
}

def translate_text(text):
    if not text:
        return text
    # Simple check if looks like English (basic heuristic)
    if not re.search(r'[a-zA-Z]', text):
        return text
        
    try:
        # Retry logic
        for attempt in range(3):
            try:
                translated = GoogleTranslator(source='auto', target='pt').translate(text)
                return translated
            except Exception as e:
                print(f"Translation failed (attempt {attempt+1}): {e}")
                time.sleep(1)
        return text # Return original if fails
    except Exception as e:
        print(f"Fatal translation error: {e}")
        return text

from concurrent.futures import ThreadPoolExecutor, as_completed

def translate_exercise(ex):
    # Helper to translate a single exercise object
    try:
        # 1. Translate Body Parts using MAP (Fast)
        if 'body_parts' in ex:
            new_parts = []
            for bp in ex['body_parts']:
                new_parts.append(BODY_PART_MAP.get(bp, bp))
            ex['body_parts'] = new_parts

        # 2. Translate text fields
        if 'description' in ex and ex['description']:
            ex['description'] = translate_text(ex['description'])

        if 'instructions' in ex:
            new_instr = []
            for instr in ex['instructions']:
                new_instr.append(translate_text(instr))
            ex['instructions'] = new_instr

        if 'tips' in ex:
            new_tips = []
            for tip in ex['tips']:
                new_tips.append(translate_text(tip))
            ex['tips'] = new_tips
            
        return ex
    except Exception as e:
        print(f"Error processing exercise {ex.get('id')}: {e}")
        return ex

def process_exercises():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            exercises = json.load(f)

        total = len(exercises)
        print(f"Starting generic translation for {total} exercises with 10 threads...")
        
        translated_exercises = []
        
        # Use ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all tasks
            future_to_ex = {executor.submit(translate_exercise, ex): ex for ex in exercises}
            
            completed_count = 0
            for future in as_completed(future_to_ex):
                completed_count += 1
                if completed_count % 50 == 0:
                    print(f"Completed {completed_count}/{total}")
                
                try:
                    data = future.result()
                    # We can't guarantee order here easily without indices, 
                    # but exercises is a list. Actually future.result() returns the modified dict.
                    # We need to maintain order? 'exercises' list objects are mutated in place if we pass reference?
                    # No, deep-translator might not matter, but let's be safe.
                    # Actually, submit(translate_exercise, ex) passes the object reference 'ex'.
                    # 'translate_exercise' modifies 'ex' in place.
                    # So 'exercises' list IS being updated concurrently.
                    # Dictionary/List updates in Python are thread-safe for single operations, 
                    # but keys assignment is atomic. 
                    # Since each thread works on a DIFFERENT dict object (exercise), this is safe.
                    pass 
                except Exception as exc:
                    print(f"Task generated an exception: {exc}")

        print("Saving translated file...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)
        
        print(f"Done! Saved to {OUTPUT_FILE}")

    except Exception as e:
        print(f"Fatal Error: {e}")


if __name__ == "__main__":
    process_exercises()
