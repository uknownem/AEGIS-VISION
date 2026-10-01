import numpy as np

def calculate_target_distance(camera_coords, pixel_box, camera_matrix, extrinsic_matrix):
    """
    Calculates the 3D real-world vector and ground distance from the base/camera 
    to a detected target using pinhole camera geometry and homography.
    
    :param camera_coords: Tuple (lat, lon, altitude) of the military base camera
    :param pixel_box: [x_min, y_min, x_max, y_max] bounding box of the enemy target
    :param camera_matrix: Intrinsic matrix of the security camera (3x3)
    :param extrinsic_matrix: Rotation and translation matrix mapping camera to ground frame (3x4)
    """
    # 1. Find the bottom-center point of the bounding box (contact point with the ground)
    x_center = (pixel_box[0] + pixel_box[2]) / 2.0
    y_bottom = pixel_box[3] 
    pixel_point = np.array([x_center, y_bottom, 1.0]) # Homogeneous pixel coordinates

    # 2. Back-project pixel to a 3D ray in camera coordinate system using inverse intrinsics
    K_inv = np.linalg.inv(camera_matrix)
    ray_camera = K_inv.dot(pixel_point)

    # 3. Transform ray from camera coordinates to world/base coordinates using extrinsics
    R = extrinsic_matrix[:, :3]  # Rotation matrix
    T = extrinsic_matrix[:, 3]   # Translation vector
    
    # Direction vector in world coordinates
    ray_world = np.linalg.inv(R).dot(ray_camera)
    
    # 4. Intersect the ray with the ground plane (assuming ground is at Z = 0 or base altitude)
    camera_height = camera_coords[2]
    
    # Z_world = camera_height + ray_world[2] * t = 0 => solve for scale factor 't'
    # Adding a small epsilon to avoid division by zero
    t = -camera_height / (ray_world[2] + 1e-6)
    
    target_x = ray_world[0] * t
    target_y = ray_world[1] * t
    
    # 5. Compute Euclidean distance vector magnitude in meters
    ground_distance = np.sqrt(target_x**2 + target_y**2)
    
    return {
        "distance_meters": round(ground_distance, 2),
        "relative_vector": (round(target_x, 2), round(target_y, 2))
    }
