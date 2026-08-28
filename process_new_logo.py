from PIL import Image
import os

input_path = r"C:/Users/braul/.gemini/antigravity/brain/690c6bfb-8398-4be5-b404-3dec253c7ab2/strive_clean_dumbbell_logo_1769966959300.png"
output_dir = r"c:/strive/assets/images"

def process_logo(img, target_color=(0, 0, 0)):
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()
    new_img = Image.new("RGBA", (width, height))
    new_pixels = new_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Dark pixels become the target logo color
            if r < 150 and g < 150 and b < 150:
                new_pixels[x, y] = (*target_color, 255)
            else:
                new_pixels[x, y] = (0, 0, 0, 0)
    return new_img

if os.path.exists(input_path):
    img = Image.open(input_path)
    
    # logo_transparent.png
    logo_black = process_logo(img, (0, 0, 0))
    bbox = logo_black.getbbox()
    if bbox:
        logo_black = logo_black.crop(bbox)
        # padding
        p = 10
        padded = Image.new("RGBA", (logo_black.width + p*2, logo_black.height + p*2), (0,0,0,0))
        padded.paste(logo_black, (p, p))
        logo_black = padded
    logo_black.save(os.path.join(output_dir, "logo_transparent.png"))
    
    # logo_transparent_white.png
    logo_white = process_logo(img, (255, 255, 255))
    if bbox:
        logo_white = logo_white.crop(bbox)
        padded_w = Image.new("RGBA", (logo_white.width + p*2, logo_white.height + p*2), (0,0,0,0))
        padded_w.paste(logo_white, (p, p))
        logo_white = padded_w
    logo_white.save(os.path.join(output_dir, "logo_transparent_white.png"))
    
    # Icon upgrade
    icon_size = 1024
    icon = Image.new("RGBA", (icon_size, icon_size), (0, 0, 0, 0))
    s = max(logo_black.size)
    sc = (icon_size * 0.7) / s
    nw, nh = int(logo_black.width * sc), int(logo_black.height * sc)
    sc_logo = logo_black.resize((nw, nh), Image.Resampling.LANCZOS)
    icon.paste(sc_logo, ((icon_size-nw)//2, (icon_size-nh)//2), sc_logo)
    icon.save(os.path.join(output_dir, "icon.png"))
    icon.save(os.path.join(output_dir, "adaptive-icon.png"))
    
    print("Clean branding upgrade completed.")
else:
    print(f"Logo file not found: {input_path}")
