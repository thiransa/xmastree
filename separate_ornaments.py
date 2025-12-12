#!/usr/bin/env python3
"""
Script to separate individual ornaments from a composite image
"""

from PIL import Image
import os

def separate_ornaments_advanced(input_path, output_dir):
    """
    Separate ornaments using smarter detection
    """
    # Open the image
    img = Image.open(input_path)
    print(f"Image size: {img.size}")
    print(f"Image mode: {img.mode}")
    
    width, height = img.size
    
    # Try different grid configurations for 14 ornaments
    # Common layouts: 7x2, 2x7
    configs = [
        (7, 2),  # 7 columns, 2 rows
        (2, 7),  # 2 columns, 7 rows
    ]
    
    print("\nTrying different grid configurations...")
    
    for cols, rows in configs:
        print(f"\nTrying {cols}x{rows} grid:")
        ornament_width = width // cols
        ornament_height = height // rows
        print(f"  Each ornament: {ornament_width}x{ornament_height}")
        
    # Let's use 7 columns x 2 rows (more likely for ornaments)
    cols = 7
    rows = 2
    
    ornament_width = width // cols
    ornament_height = height // rows
    
    print(f"\nUsing grid: {cols}x{rows}")
    print(f"Each ornament size: {ornament_width}x{ornament_height}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    ornament_count = 0
    
    # Extract each ornament
    for row in range(rows):
        for col in range(cols):
            ornament_count += 1
            
            # Calculate crop box
            left = col * ornament_width
            top = row * ornament_height
            right = left + ornament_width
            bottom = top + ornament_height
            
            # Crop the ornament
            ornament = img.crop((left, top, right, bottom))
            
            # Save the ornament
            output_path = os.path.join(output_dir, f"ornament-{ornament_count}.png")
            ornament.save(output_path)
            print(f"Saved: ornament-{ornament_count}.png ({left},{top} to {right},{bottom})")
    
    print(f"\nSuccessfully extracted {ornament_count} ornaments!")
    return ornament_count

if __name__ == "__main__":
    input_image = "/Users/thiransamuthumala/xmastree/assets/ornamnents.PNG"
    output_directory = "/Users/thiransamuthumala/xmastree/assets/ornaments"
    
    try:
        count = separate_ornaments_advanced(input_image, output_directory)
        print(f"\nAll {count} ornaments saved to: {output_directory}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
