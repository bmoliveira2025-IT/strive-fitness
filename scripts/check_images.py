
import os

directory = r"c:\Users\braul\.gemini\antigravity\scratch\gym_app\mobile_app\assets\images"
# Get all files in directory
files = [f for f in os.listdir(directory) if f.endswith('.png')]

for filename in files:
    path = os.path.join(directory, filename)
    if not os.path.exists(path):
        print(f"MISSING: {filename}")
        continue
        
    with open(path, "rb") as f:
        header = f.read(16)
        
    is_png = header.startswith(b'\x89PNG\r\n\x1a\n')
    is_webp = b'WEBP' in header
    is_jpeg = header.startswith(b'\xff\xd8')
    
    print(f"File: {filename}")
    print(f"  Header (hex): {header.hex()}")
    if is_png:
        print("  Format: PNG (Valid signature)")
    elif is_webp:
        print("  Format: WebP (Invalid extension .png)")
    elif is_jpeg:
        print("  Format: JPEG (Invalid extension .png)")
    else:
        print("  Format: Unknown")
