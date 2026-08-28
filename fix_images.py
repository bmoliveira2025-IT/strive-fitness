from PIL import Image
import os

files = [
    'assets/coaches/elena.png',
    'assets/coaches/julia.png',
    'assets/coaches/marcos.png'
]

for f in files:
    try:
        path = os.path.join(os.getcwd(), f)
        if os.path.exists(path):
            img = Image.open(path)
            # FORCE converting to RGBA to ensure standard PNG 32-bit (or RGB for 24-bit)
            # This often fixes corrupted chunks or color profiles
            img = img.convert("RGBA")
            img.save(path, "PNG")
            print(f"Fixed {f}")
        else:
            print(f"File not found: {f}")
    except Exception as e:
        print(f"Error processing {f}: {e}")
