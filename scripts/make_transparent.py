from PIL import Image
import sys
import os

def remove_background(input_path, output_path, threshold=200):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        # Get background color from top-left pixel
        bg_color = img.getpixel((0, 0))
        
        # Simple heuristic: if top-left is transparent, do nothing? 
        # But maybe it is white.
        print(f"Processing {input_path}. Top-left pixel: {bg_color}")

        for item in datas:
            # Check if pixel is close to white (common in AI generations)
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0)) # Make transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved transparent image to {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_transparent.py <file1> <file2> ...")
        sys.exit(1)
    
    for file_path in sys.argv[1:]:
        remove_background(file_path, file_path)
