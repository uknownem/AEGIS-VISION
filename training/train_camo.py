# YOLO Training Script for AEGIS-VISION
from ultralytics import YOLO

def train_camouflage_model():
    """
    Trains a YOLO model specifically for Camouflaged Object Detection 
    (e.g., using CAMO or COD10K dataset).
    """
    # Start with a pretrained YOLOv8 model for faster convergence
    model = YOLO("yolov8n.pt") 
    
    # Train the model using your custom dataset configuration
    results = model.train(
        data="data.yaml",   # Path to dataset YAML configuration
        epochs=100,         # Number of training epochs
        imgsz=640,          # Image size
        batch=16,           # Batch size depending on your GPU memory
        name="aegis_camo",  # Name of the output weights folder
        device="0"          # Use GPU 0. Set to "cpu" if no GPU is available
    )
    
    print("Training Complete! The best weights are saved in runs/detect/aegis_camo/weights/best.pt")
    
if __name__ == "__main__":
    train_camouflage_model()
