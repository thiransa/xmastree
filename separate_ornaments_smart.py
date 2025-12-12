#!/usr/bin/env python3
"""
Smart ornament separator using content detection
"""

from PIL import Image
import os

def has_content(img, x, y, w, h, threshold=10):
    """Check if a region has significant non-transparent content"""
    region = img.crop((x, y, x + w, y + h))
    pixels = list(region.getdata())
    
    non_transparent = 0
    for pixel in pixels:
        if len(pixel) == 4 and pixel[3] > 128:  # Check alpha channel
            non_transparent += 1
    
    return non_transparent > threshold

def find_ornament_bounds(img):
    """Find bounding boxes of ornaments by detecting content"""
    width, height = img.size
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    print("Analyzing image to detect ornament positions...")
    
    # Sample the image to find ornaments
    # Assuming ornaments are arranged in rows
    ornaments = []
    
    # Try to detect rows by scanning vertically
    scan_height = 50  # Height to scan for content
    y = 0
    row_starts = []
    
    while y < height - scan_height:
        if has_content(img, 0, y, width, scan_height, threshold=100):
            row_starts.append(y)
            # Skip ahead to avoid detecting same row multiple times
            y += height // 4
        else:
            y += 20
    
    print(f"Found {len(row_starts)} potential rows at y positions: {row_starts}")
    
    # For each row, find individual ornaments by scanning horizontally
    ornament_list = []
    for row_idx, row_y in enumerate(row_starts):
        row_height = (row_starts[row_idx + 1] - row_y) if row_idx + 1 < len(row_starts) else (height - row_y)
        
        x = 0
        col_count = 0
        while x < width:
            scan_width = 80
            if has_content(img, x, row_y, scan_width, row_height, threshold=50):
                # Found an ornament, estimate its width
                ornament_width = width // 7  # Assuming 7 columns
                ornament_list.append({
                    'x': x,
                    'y': row_y,
                    'width': ornament_width,
                    'height': row_height,
                    'col': col_count
                })
                x += ornament_width
                col_count += 1
            else:
                x += 20
    
    return ornament_list

def separate_ornaments_smart(input_path, output_dir):
    """Separate ornaments using content detection"""
    img = Image.open(input_path)
    print(f"Image size: {img.size}")
    print(f"Image mode: {img.mode}")
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    width, height = img.size
    
    # Simple approach: assume 7 columns x 2 rows based on 1024x1536
    # But with better boundary detection
    cols = 7
    rows = 2
    
    # Calculate dimensions with some padding
    col_width = width / cols
    row_height = height / rows
    
    print(f"\nUsing {cols}x{rows} grid with padding")
    print(f"Column width: {col_width}, Row height: {row_height}")
    
    os.makedirs(output_dir, exist_ok=True)
    
    ornament_count = 0
    
    for row in range(rows):
        for col in range(cols):
            ornament_count += 1
            
            # Add small padding to avoid cutting edges
            padding = 5
            left = int(col * col_width) + padding
            top = int(row * row_height) + padding
            right = int((col + 1) * col_width) - padding
            bottom = int((row + 1) * row_height) - padding
            
            # Ensure we don't go out of bounds
            left = max(0, left)
            top = max(0, top)
            right = min(width, right)
            bottom = min(height, bottom)
            
            ornament = img.crop((left, top, right, bottom))
            
            # Trim transparent edges
            bbox = ornament.getbbox()
            if bbox:
                ornament = ornament.crop(bbox)
            
            output_path = os.path.join(output_dir, f"ornament-{ornament_count}.png")
            ornament.save(output_path)
            print(f"Saved: ornament-{ornament_count}.png (size: {ornament.size})")
    
    print(f"\nSuccessfully extracted {ornament_count} ornaments!")
    return ornament_count

if __name__ == "__main__":
    input_image = "/Users/thiransamuthumala/xmastree/assets/ornamnents.PNG"
    output_directory = "/Users/thiransamuthumala/xmastree/assets/ornaments"
    
    try:
        count = separate_ornaments_smart(input_image, output_directory)
        print(f"\nAll {count} ornaments saved to: {output_directory}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
