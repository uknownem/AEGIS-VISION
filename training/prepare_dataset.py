import os
import cv2
import numpy as np
import shutil
import random
from pathlib import Path

def create_yolo_dataset():
    base_dir = Path("dataset/CAMO-V.1.0-CVIU2019")
    images_dir = base_dir / "Images"
    gt_dir = base_dir / "GT"
    
    out_dir = Path("yolo_dataset")
    
    # Create required directories
    for split in ["train", "val"]:
        os.makedirs(out_dir / "images" / split, exist_ok=True)
        os.makedirs(out_dir / "labels" / split, exist_ok=True)
        
    image_files = list(images_dir.glob("*.jpg"))
    
    # Simple split: 80% train, 20% validation
    random.seed(42)
    shuffled_files = list(image_files)
    random.shuffle(shuffled_files)
    split_idx = int(len(shuffled_files) * 0.8)
    train_files = shuffled_files[:split_idx]
    val_files = shuffled_files[split_idx:]
    
    def process_split(files, split_name):
        print(f"Processing {split_name} split ({len(files)} files)...")
        for img_path in files:
            mask_path = gt_dir / f"{img_path.stem}.png"
            
            if not mask_path.exists():
                continue
                
            # Read mask and find bounding boxes
            mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
            if mask is None:
                continue
                
            h, w = mask.shape
            
            # Find contours in the binary mask
            # Typically CAMO masks are binary where the object is white (>0)
            _, binary = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Prepare label file
            label_lines = []
            class_id = 0 # 0 for "hidden_threat"
            
            for cnt in contours:
                x, y, bw, bh = cv2.boundingRect(cnt)
                
                # Filter out very small noise boxes
                if bw < 10 or bh < 10:
                    continue
                    
                # Convert to YOLO format: x_center, y_center, width, height (normalized)
                x_center = (x + bw / 2.0) / w
                y_center = (y + bh / 2.0) / h
                nw = bw / w
                nh = bh / h
                
                label_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {nw:.6f} {nh:.6f}")
            
            if label_lines:
                # Copy image
                shutil.copy(img_path, out_dir / "images" / split_name / img_path.name)
                # Write label
                label_out = out_dir / "labels" / split_name / f"{img_path.stem}.txt"
                with open(label_out, "w") as f:
                    f.write("\n".join(label_lines))

    process_split(train_files, "train")
    process_split(val_files, "val")
    print("Dataset preparation complete! Stored in 'training/yolo_dataset'")

if __name__ == "__main__":
    create_yolo_dataset()
