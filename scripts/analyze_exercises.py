import json
import re

try:
    with open(r'c:\Users\braul\.gemini\antigravity\scratch\gym_app\mobile_app\assets\exercises.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    unique_body_parts = set()
    english_instructions_count = 0
    english_tips_count = 0
    english_descriptions_count = 0
    total_exercises = len(data)

    english_pattern = re.compile(r'\b(the|and|with|this|your|ensure|slowly|avoid)\b', re.IGNORECASE)

    sample_english_instr = []

    for ex in data:
        # Body Parts
        if 'body_parts' in ex:
            for bp in ex['body_parts']:
                unique_body_parts.add(bp)

        # Instructions
        is_english_instr = False
        if 'instructions' in ex:
            full_instr = " ".join(ex['instructions'])
            if english_pattern.search(full_instr):
                is_english_instr = True
                english_instructions_count += 1
                if len(sample_english_instr) < 3:
                    sample_english_instr.append(full_instr)

        # Tips
        if 'tips' in ex:
            full_tips = " ".join(ex['tips'])
            if english_pattern.search(full_tips):
                english_tips_count += 1
        
        # Description
        if 'description' in ex and english_pattern.search(ex['description']):
             english_descriptions_count += 1

    print(f"Total Exercises: {total_exercises}")
    print("\nUnique Body Parts:")
    print(sorted(list(unique_body_parts)))
    print(f"\nEnglish Instructions: {english_instructions_count}")
    print(f"English Tips: {english_tips_count}")
    print(f"English Descriptions: {english_descriptions_count}")
    print("\nSample English Instructions:")
    for s in sample_english_instr:
        print(f"- {s[:100]}...")

except Exception as e:
    print(f"Error: {e}")
