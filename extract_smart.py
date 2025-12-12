#!/usr/bin/env python3
"""
Extract ornaments using detected gaps
"""

from PIL import Image
import numpy as np

def find_content_regions(input_path):
    """Find individual ornament regions by detecting content boundaries"""
    img = Image.open(input_path)
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    width, height = img.size
    img_array = np.array(img)
    alpha_channel = img_array[:, :, 3]
    
    # Find horizontal gaps (between rows)
    print("Finding horizontal gaps...")
    h_gaps = []
    for y in range(height - 1):
        if np.sum(alpha_channel[y, :] > 50) < 10:  # Empty row
            h_gaps.append(y)
    
    # Group consecutive gaps
    h_boundaries = [0]
    if h_gaps:
        prev = h_gaps[0]
        for gap in h_gaps[1:]:
            if gap - prev > 1:  # New gap group
                h_boundaries.append(prev)
                h_boundaries.append(gap)
            prev = gap
        h_boundaries.append(h_gaps[-1])
    h_boundaries.append(height)
    
    # Remove duplicates and sort
    h_boundaries = sorted(list(set(h_boundaries)))
    print(f"Horizontal boundaries: {h_boundaries}")
    
    # For each row, find vertical gaps (between columns)
    all_regions = []
    
    for row_idx in range(len(h_boundaries) - 1):
        row_top = h_boundaries[row_idx]
        row_bottom = h_boundaries[row_idx + 1]
        
        if row_bottom - row_top < 50:  # Skip thin rows
            continue
        
        print(f"\nAnalyzing row {row_idx + 1}: y={row_top} to {row_bottom}")
        
        # Find vertical gaps in this row
        row_region = alpha_channel[row_top:row_bottom, :]
        col_content = np.sum(row_region > 50, axis=0)
        
        v_gaps = []
        for x in range(width):
            if col_content[x] < 5:
                v_gaps.append(x)
        
        # Group consecutive gaps
        v_boundaries = [0]
        if v_gaps:
            prev = v_gaps[0]
            gap_start = prev
            for gap in v_gaps[1:]:
                if gap - prev > 1:  # New gap group
                    v_boundaries.append((gap_start + prev) // 2)
                    gap_start = gap
                prev = gap
            v_boundaries.append((gap_start + prev) // 2)
        v_boundaries.append(width)
        
        v_boundaries = sorted(list(set(v_boundaries)))
        print(f"  Vertical boundaries: {v_boundaries}")
        print(f"  Found {len(v_boundaries) - 1} ornaments in this row")
        
        # Create regions for this row
        for col_idx in range(len(v_boundaries) - 1):
            left = v_boundaries[col_idx]
            right = v_boundaries[col_idx + 1]
            
            if right - left < 30:  # Skip thin columns
                continue
            
            all_regions.append({
                'left': left,
                'top': row_top,
                'right': right,
                'bottom': row_bottom
            })
    
    return all_regions

def extract_ornaments(input_path, output_dir):
    """Extract ornaments based on detected regions"""
    import os
    
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    regions = find_content_regions(input_path)
    
    print(f"\n=== EXTRACTING {len(regions)} ORNAMENTS ===")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for idx, region in enumerate(regions, 1):
        ornament = img.crop((region['left'], region['top'], region['right'], region['bottom']))
        
        # Trim transparent edges
        bbox = ornament.getbbox()
        if bbox:
            ornament = ornament.crop(bbox)
        
        output_path = os.path.join(output_dir, f"ornament-{idx}.png")
        ornament.save(output_path)
        print(f"Saved ornament-{idx}.png ({ornament.size[0]}x{ornament.size[1]})")
    
    return len(regions)

if __name__ == "__main__":
    input_image = "/Users/thiransamuthumala/xmastree/assets/ornamnents.PNG"
    output_directory = "/Users/thiransamuthumala/xmastree/assets/ornaments"
    
    try:
        count = extract_ornaments(input_image, output_directory)
        print(f"\nSuccessfully extracted {count} ornaments!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
