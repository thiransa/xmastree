#!/usr/bin/env python3
"""
Smart ornament extraction script
Automatically detects and extracts individual ornaments from orgg.PNG
"""

import os
from PIL import Image
import numpy as np

def find_bounding_boxes(image_array, threshold=10):
    """
    Find bounding boxes of non-transparent objects in the image
    """
    # Get alpha channel
    if image_array.shape[2] == 4:
        alpha = image_array[:, :, 3]
    else:
        # If no alpha, use brightness threshold
        gray = np.mean(image_array[:, :, :3], axis=2)
        alpha = (gray < 250).astype(np.uint8) * 255
    
    # Find rows and columns with content
    rows_with_content = np.where(np.any(alpha > threshold, axis=1))[0]
    cols_with_content = np.where(np.any(alpha > threshold, axis=0))[0]
    
    if len(rows_with_content) == 0 or len(cols_with_content) == 0:
        return []
    
    # Simple grid detection - split into equal parts
    height, width = image_array.shape[:2]
    
    # Try to detect grid layout (assuming 4x2, 3x3, etc.)
    boxes = []
    
    # Attempt 1: Detect individual objects by connected components
    from scipy import ndimage
    labeled, num_features = ndimage.label(alpha > threshold)
    
    for i in range(1, num_features + 1):
        component = (labeled == i)
        rows = np.where(np.any(component, axis=1))[0]
        cols = np.where(np.any(component, axis=0))[0]
        
        if len(rows) > 10 and len(cols) > 10:  # Minimum size filter
            y_min, y_max = rows[0], rows[-1]
            x_min, x_max = cols[0], cols[-1]
            
            # Add some padding
            padding = 5
            y_min = max(0, y_min - padding)
            y_max = min(height, y_max + padding)
            x_min = max(0, x_min - padding)
            x_max = min(width, x_max + padding)
            
            boxes.append((x_min, y_min, x_max, y_max))
    
    return boxes

def extract_ornaments(input_path, output_dir):
    """
    Extract individual ornaments from the input image
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Load image
    img = Image.open(input_path)
    img_array = np.array(img)
    
    print(f"Image size: {img.size}")
    print(f"Image mode: {img.mode}")
    
    # Find bounding boxes
    boxes = find_bounding_boxes(img_array)
    
    print(f"Found {len(boxes)} ornaments")
    
    # Extract each ornament
    extracted_count = 0
    for idx, (x_min, y_min, x_max, y_max) in enumerate(boxes, start=1):
        # Crop ornament
        ornament = img.crop((x_min, y_min, x_max, y_max))
        
        # Check if ornament has sufficient content
        ornament_array = np.array(ornament)
        if ornament_array.shape[2] == 4:
            non_transparent_pixels = np.sum(ornament_array[:, :, 3] > 10)
            total_pixels = ornament_array.shape[0] * ornament_array.shape[1]
            
            # Skip if less than 5% is content
            if non_transparent_pixels / total_pixels < 0.05:
                continue
        
        # Save ornament
        output_path = os.path.join(output_dir, f'ornament-extracted-{idx}.png')
        ornament.save(output_path)
        print(f"Saved: {output_path} ({ornament.size})")
        extracted_count += 1
    
    print(f"\nSuccessfully extracted {extracted_count} ornaments!")
    return extracted_count

def main():
    # Paths
    input_file = 'assets/ornaments/orgg.PNG'
    output_dir = 'assets/ornaments'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        print("Please make sure orgg.PNG is in the assets/ornaments folder.")
        return
    
    print("Starting ornament extraction...")
    print("-" * 50)
    
    count = extract_ornaments(input_file, output_dir)
    
    print("-" * 50)
    print(f"Done! Extracted {count} ornaments to {output_dir}/")
    print("\nNext steps:")
    print("1. Check the extracted ornaments")
    print("2. The ornaments will automatically appear in the editor")

if __name__ == '__main__':
    main()
