
import os
from PIL import Image

directory = r"c:\Users\braul\.gemini\antigravity\scratch\gym_app\mobile_app\assets\images"
files = [
    "android-icon-foreground.png",
    "favicon.png",
    "icon.png",
    "splash-icon.png",
    "splash.png"
]

print("Starting conversion...")
for filename in files:
    path = os.path.join(directory, filename)
    if not os.path.exists(path):
        print(f"MISSING: {filename}")
        continue
        
    try:
        print(f"Processing {filename}...")
        with Image.open(path) as img:
            img.load() # Ensure loaded
            # Convert to RGB to ensure no opacity issues regarding jpeg (though jpeg has no alpha)
            # But we want to save as PNG.
            if img.mode != 'RGB' and img.mode != 'RGBA':
                img = img.convert('RGB')
                
            # We must save to a buffer or temp because we are overwriting the file we just read?
            # Actually, `with Image.open` keeps file open until block exit?
            # Better to save to temp and rename.
            
            temp_path = path + ".tmp.png"
            img.save(temp_path, "PNG")
            
        # Move back
        os.replace(temp_path, path)
        print(f"Converted {filename} to real PNG.")
        
    except Exception as e:
        print(f"FAILED {filename}: {e}")

print("Done.")
