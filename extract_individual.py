#!/usr/bin/env python3
"""
Recursively separate ornaments that contain multiple elements
"""

from PIL import Image
import numpy as np
from scipy import ndimage
import os

def find_individual_objects(img_array, min_size=30):
    """Find individual objects in an image using connected components"""
    alpha_channel = img_array[:, :, 3]
    height, width = alpha_channel.shape
    
    # Create binary mask
    mask = (alpha_channel > 50).astype(int)
    
    # Label connected components
    labeled_array, num_features = ndimage.label(mask)
    
    regions = []
    
    # Find bounding box for each component
    for label_num in range(1, num_features + 1):
        component_mask = (labeled_array == label_num)
        pixels = np.sum(component_mask)
        
        if pixels > min_size:
            # Find bounding box
            coords = np.argwhere(component_mask)
            min_y, min_x = coords.min(axis=0)
            max_y, max_x = coords.max(axis=0)
            
            # Add some padding
            padding = 2
            min_y = max(0, min_y - padding)
            max_y = min(height - 1, max_y + padding)
            min_x = max(0, min_x - padding)
            max_x = min(width - 1, max_x + padding)
            
            regions.append({
                'left': min_x,
                'top': min_y,
                'right': max_x + 1,
                'bottom': max_y + 1,
                'pixels': pixels
            })
    
    # Sort regions by position (top to bottom, left to right)
    regions.sort(key=lambda r: (r['top'], r['left']))
    
    return regions

def separate_all_ornaments(input_path, output_dir):
    """Separate all ornaments including sub-ornaments"""
    img = Image.open(input_path)
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    width, height = img.size
    img_array = np.array(img)
    
    print(f"Image size: {width}x{height}")
    print("Finding all individual ornaments...")
    
    regions = find_individual_objects(img_array, min_size=100)
    
    print(f"Found {len(regions)} individual ornaments")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for idx, region in enumerate(regions, 1):
        ornament = img.crop((region['left'], region['top'], region['right'], region['bottom']))
        
        output_path = os.path.join(output_dir, f"ornament-{idx}.png")
        ornament.save(output_path)
        
        size = ornament.size
        print(f"Saved ornament-{idx}.png ({size[0]}x{size[1]}, {region['pixels']} pixels)")
    
    return len(regions)

if __name__ == "__main__":
    input_image = "/Users/thiransamuthumala/xmastree/assets/ornamnents.PNG"
    output_directory = "/Users/thiransamuthumala/xmastree/assets/ornaments"
    
    try:
        count = separate_all_ornaments(input_image, output_directory)
        print(f"\n✓ Successfully extracted {count} ornaments!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
