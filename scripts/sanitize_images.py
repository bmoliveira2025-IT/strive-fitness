import os
from PIL import Image

def sanitize_png(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    try:
        with Image.open(file_path) as img:
            # Re-save without metadata/iCCP profiling which often breaks Gradle
            img.save(file_path, "PNG", icc_profile=None)
            print(f"Sanitized: {file_path}")
    except Exception as e:
        print(f"Error sanitizing {file_path}: {e}")

images_to_sanitize = [
    "./assets/images/icon.png",
    "./assets/images/android-icon-foreground.png",
    "./assets/images/splash-icon.png",
    "./assets/images/splash.png",
    "./assets/images/splash-light.png",
    "./assets/images/favicon.png"
]

if __name__ == "__main__":
    # Change CWD to the project root (assuming script is in ./scripts)
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for img_path in images_to_sanitize:
        sanitize_png(img_path)
