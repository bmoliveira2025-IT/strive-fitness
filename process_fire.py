from PIL import Image
import math
import os

input_path = r"C:/Users/braul/.gemini/antigravity/brain/690c6bfb-8398-4be5-b404-3dec253c7ab2/fire_trail_transparent_1769966701078.png"
output_path = r"c:/strive/assets/images/fire_trail.png"

def remove_white_bg(img):
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    new_img = Image.new("RGBA", (width, height))
    new_pixels = new_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Distance from white
            dist = math.sqrt((255-r)**2 + (255-g)**2 + (255-b)**2)
            
            # For fire, we want to be more careful with light colors (yellows)
            # Yellow is (255, 255, 0) -> dist is 255 from white. Correct.
            # Light gray/white background has low dist.
            
            if dist < 40:
                new_pixels[x, y] = (0, 0, 0, 0)
            elif dist < 100:
                # Smooth alpha transition
                alpha = int(((dist - 40) / 60) * 255)
                new_pixels[x, y] = (r, g, b, alpha)
            else:
                new_pixels[x, y] = (r, g, b, 255)
                
    return new_img

if os.path.exists(input_path):
    img = Image.open(input_path)
    transparent_fire = remove_white_bg(img)
    
    bbox = transparent_fire.getbbox()
    if bbox:
        transparent_fire = transparent_fire.crop(bbox)
        
    transparent_fire.save(output_path)
    print(f"Fire trail generated at {output_path}")
else:
    print(f"Input not found: {input_path}")
