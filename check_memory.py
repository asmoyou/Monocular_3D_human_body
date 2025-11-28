"""
Diagnostic script to check SAM-3D-Body model memory usage
"""
import torch
import gc
from notebook.utils import setup_sam_3d_body

def print_gpu_memory():
    """Print current GPU memory usage"""
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            allocated = torch.cuda.memory_allocated(i) / 1024**3
            reserved = torch.cuda.memory_reserved(i) / 1024**3
            print(f"GPU {i}:")
            print(f"  Allocated: {allocated:.2f} GB")
            print(f"  Reserved:  {reserved:.2f} GB")
    else:
        print("CUDA not available")

print("=" * 60)
print("BEFORE MODEL LOADING")
print("=" * 60)
print_gpu_memory()

print("\n" + "=" * 60)
print("LOADING MODEL...")
print("=" * 60)

# Load with full components (default)
estimator = setup_sam_3d_body(hf_repo_id="facebook/sam-3d-body-dinov3")

print("\n" + "=" * 60)
print("AFTER MODEL LOADING (Full Mode)")
print("=" * 60)
print_gpu_memory()

# Clean up
del estimator
gc.collect()
torch.cuda.empty_cache()

print("\n" + "=" * 60)
print("AFTER CLEANUP")
print("=" * 60)
print_gpu_memory()

print("\n" + "=" * 60)
print("LOADING MODEL (Lightweight Mode)...")
print("=" * 60)

# Load without FOV estimator
estimator_lite = setup_sam_3d_body(
    hf_repo_id="facebook/sam-3d-body-dinov3",
    fov_name=None  # Disable FOV estimator
)

print("\n" + "=" * 60)
print("AFTER MODEL LOADING (Lightweight Mode)")
print("=" * 60)
print_gpu_memory()

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print("The model loads:")
print("1. SAM-3D-Body main model")
print("2. Human Detector (VitDet)")
print("3. FOV Estimator (MoGe2) - can be disabled")
print("")
print("To use lightweight mode, run:")
print("  set LIGHTWEIGHT_MODE=true")
print("  python app.py")
print("Or use: start-lightweight.bat")
