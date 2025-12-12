#!/usr/bin/env python3
"""
Analyze ornaments image structure
"""

from PIL import Image
import numpy as np

def analyze_image_structure(input_path):
    """Analyze the image to understand ornament layout"""
    img = Image.open(input_path)
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # Convert to numpy array for easier analysis
    img_array = np.array(img)
    alpha_channel = img_array[:, :, 3]
    
    # Find rows with content by checking alpha channel
    row_has_content = []
    for y in range(height):
        non_transparent_pixels = np.sum(alpha_channel[y, :] > 50)
        row_has_content.append(non_transparent_pixels)
    
    # Find columns with content
    col_has_content = []
    for x in range(width):
        non_transparent_pixels = np.sum(alpha_channel[:, x] > 50)
        col_has_content.append(non_transparent_pixels)
    
    # Detect row boundaries (gaps in content)
    print("\n=== ROW ANALYSIS ===")
    row_gaps = []
    in_gap = True
    gap_start = 0
    
    for y in range(height):
        if row_has_content[y] < 10:  # Almost empty row
            if not in_gap:
                in_gap = True
                gap_start = y
        else:  # Has content
            if in_gap and gap_start > 0:
                row_gaps.append((gap_start, y))
            in_gap = False
    
    print(f"Found {len(row_gaps)} row gaps:")
    for i, (start, end) in enumerate(row_gaps):
        print(f"  Gap {i+1}: rows {start}-{end}")
    
    # Detect column boundaries
    print("\n=== COLUMN ANALYSIS ===")
    col_gaps = []
    in_gap = True
    gap_start = 0
    
    for x in range(width):
        if col_has_content[x] < 10:  # Almost empty column
            if not in_gap:
                in_gap = True
                gap_start = x
        else:  # Has content
            if in_gap and gap_start > 0:
                col_gaps.append((gap_start, x))
            in_gap = False
    
    print(f"Found {len(col_gaps)} column gaps:")
    for i, (start, end) in enumerate(col_gaps):
        print(f"  Gap {i+1}: columns {start}-{end}")
    
    # Estimate grid structure
    num_rows = len(row_gaps) + 1
    num_cols = len(col_gaps) + 1
    
    print(f"\n=== ESTIMATED GRID ===")
    print(f"Rows: {num_rows}, Columns: {num_cols}")
    print(f"Total ornaments: {num_rows * num_cols}")
    
    return row_gaps, col_gaps

if __name__ == "__main__":
    input_image = "/Users/thiransamuthumala/xmastree/assets/ornamnents.PNG"
    
    try:
        analyze_image_structure(input_image)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
