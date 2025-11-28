# SAM 3D Body Editor

<div align="center">

An interactive web application for 3D human body pose estimation and manipulation using Meta's SAM-3D-Body model.

[中文文档](README_zh.md) | [English](#)

</div>

---

## Overview

SAM 3D Body Editor is a web-based application that enables users to upload images, automatically detect and reconstruct 3D human body models, and interactively manipulate body poses through an intuitive joint control system. Built with React and Flask, it provides real-time 3D visualization using Three.js.

## Features

- **🖼️ Image Upload**: Drag & drop or click to upload images (PNG, JPG, JPEG, WEBP)
- **🤖 Automatic Detection**: AI-powered 3D human pose estimation using SAM-3D-Body
- **🎮 Interactive 3D Viewer**: Rotate, zoom, and pan with mouse controls
- **🦴 Joint Manipulation**: Fine-grained control over body joints
  - X, Y, Z axis rotation sliders for each joint
  - Real-time visual feedback
  - Reset to original pose
- **👥 Multi-Person Support**: Detect and edit multiple people in a single image
- **🌐 Internationalization**: English and Chinese language support
- **📏 Body Measurements**: Calculate body measurements with target height adjustment
- **💀 Skeleton Visualization**: Toggle joints and bones overlay on 3D mesh
- **🎨 Modern UI**: Beautiful dark theme using Radix UI

## Technology Stack

### Backend
- **Python 3.10+**: Core language
- **Flask**: REST API server
- **SAM-3D-Body**: Meta's 3D human pose estimation model
- **OpenCV**: Image processing
- **NumPy**: Numerical computations

### Frontend
- **React 18**: UI framework
- **Radix UI**: Component library with dark theme
- **Three.js**: 3D rendering and visualization
- **Vite**: Fast build tool and dev server

## Prerequisites

- Python 3.8-3.11
- Node.js 18+
- CUDA-compatible GPU (recommended, 8GB+ VRAM)
- Conda (Anaconda/Miniconda) - recommended for environment management

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/asmoyou/Monocular_3D_human_body.git
cd Monocular_3D_human_body
```

### 2. Backend Setup

Create and activate a conda environment:

```bash
conda create -n sam_3d_body python=3.10
conda activate sam_3d_body
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

**Note**: The first run will download ~2GB model files from Hugging Face. Ensure you have a stable internet connection.

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
cd ..
```

## Usage

### Development Mode

1. **Start the backend server** (Terminal 1):

```bash
conda activate sam_3d_body

# Standard mode (~6-8GB VRAM)
python app.py

# OR Lightweight mode (~4-5GB VRAM, recommended for 8GB GPUs)
# Windows:
set LIGHTWEIGHT_MODE=true
python app.py

# Linux/Mac:
export LIGHTWEIGHT_MODE=true
python app.py
```

The Flask server will start on `http://localhost:5000`

2. **Start the frontend dev server** (Terminal 2):

```bash
cd frontend
npm run dev
```

The Vite dev server will start on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

### Production Mode

1. **Build the frontend**:

```bash
cd frontend
npm run build
```

2. **Start the Flask server**:

```bash
conda activate sam_3d_body
python app.py
```

3. **Access the app** at `http://localhost:5000`

## How to Use

1. **Upload an Image**
   - Click the upload zone or drag & drop an image
   - Supported formats: PNG, JPG, JPEG, WEBP
   - Max size: 16MB
   - Images are automatically resized if the longest edge exceeds 2048px

2. **View 3D Model**
   - The detected person(s) will appear in the 3D viewer
   - **Mouse Controls**:
     - Left click + drag: Rotate camera
     - Right click + drag: Pan view
     - Scroll wheel: Zoom in/out

3. **Adjust Pose**
   - Select "Upper Body" or "Lower Body" tab
   - Each joint has three sliders (X, Y, Z rotation axes)
   - Drag sliders to adjust joint angles
   - See real-time updates in the 3D viewer

4. **Body Measurements**
   - Click the measurement button in the viewer toolbar
   - Enter target height (optional)
   - View calculated body measurements
   - Export measurements as CSV

5. **Reset Pose**
   - Click the "Reset" button to return to original pose

6. **Multi-Person Selection**
   - If multiple people are detected, select which person to edit from the dropdown

7. **Display Options**
   - Toggle joint visualization (red spheres)
   - Toggle skeleton visualization (blue lines)

8. **Language Switch**
   - Click the language icon (🌐) in the top-right to switch between English and Chinese

## Memory Optimization

The application loads multiple deep learning models:

1. **SAM-3D-Body Main Model** (~2-3GB VRAM)
2. **Human Detector (VitDet)** (~1-2GB VRAM)
3. **FOV Estimator (MoGe2)** (~1-2GB VRAM) - *Disabled in lightweight mode*

**Total VRAM Usage**:
- Standard mode: ~6-8GB
- Lightweight mode: ~4-5GB (recommended for 8GB GPUs)

To use lightweight mode, set the environment variable before starting:

```bash
# Windows
set LIGHTWEIGHT_MODE=true

# Linux/Mac
export LIGHTWEIGHT_MODE=true
```

## Project Structure

```
Monocular_3D_human_body/
├── app.py                      # Flask backend server
├── requirements.txt            # Python dependencies
├── LICENSE                     # MIT License
├── README.md                   # This file (English)
├── README_zh.md                # Chinese documentation
├── notebook/                    # Jupyter notebook utilities
│   ├── utils.py               # Model setup utilities
│   └── demo_human.ipynb       # Demo notebook
├── sam_3d_body/                # SAM-3D-Body model package
│   ├── data/                   # Data transforms and utilities
│   ├── models/                 # Model architectures
│   ├── measurements/           # Body measurement calculations
│   └── visualization/          # Visualization utilities
├── tools/                      # Model building tools
└── frontend/                   # React frontend
    ├── package.json           # Node.js dependencies
    ├── vite.config.js         # Vite configuration
    ├── index.html             # HTML entry point
    └── src/
        ├── main.jsx           # React entry point
        ├── App.jsx            # Main app component
        ├── i18n.js            # Internationalization
        └── components/
            ├── UploadPanel.jsx      # Image upload UI
            ├── ViewerPanel.jsx      # 3D viewer with Three.js
            ├── ControlPanel.jsx     # Joint controls container
            ├── JointControl.jsx     # Individual joint sliders
            └── MeasurementOverlay.jsx  # Measurement panel
```

## API Endpoints

### `GET /api/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `POST /api/process`
Process an uploaded image and return 3D rig data

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `image` file

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "status": "queued"
}
```

### `GET /api/sessions/<session_id>`
Get processing status and results

**Response:**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "num_persons": 1,
  "rig_data": [...]
}
```

### `POST /api/measurements`
Calculate body measurements

**Request:**
```json
{
  "session_id": "uuid",
  "person_index": 0,
  "target_height_cm": 175.0
}
```

**Response:**
```json
{
  "measurements": {
    "height_cm": 175.0,
    "shoulder_width_cm": 42.5,
    ...
  },
  "schema": {...}
}
```

## Troubleshooting

### Backend Issues

**Model loading twice / High memory usage:**
- The app only loads the model once, even in debug mode
- If you still see high memory usage, try running with `debug=False` in app.py

**Model not loading:**
- Ensure you have stable internet connection (model downloads from Hugging Face)
- Check GPU/CUDA availability if using GPU
- First run will download ~2GB model - this is normal

**Image processing fails:**
- Verify image format is supported (PNG, JPG, JPEG, WEBP)
- Check image size (will be resized if > 2048px)
- Ensure the image contains visible people

**"Momentum is not enabled" warning:**
- This is a harmless warning from the model and can be safely ignored

### Frontend Issues

**3D model not appearing:**
- Check browser console for errors (F12 → Console tab)
- Look for `[Viewer]` prefixed messages in console
- Verify backend is running on port 5000
- Try a different image
- Check if WebGL is enabled in your browser

**Cannot control camera / view:**
- Ensure the model has finished loading
- Try clicking on the canvas area first
- Check console for OrbitControls initialization messages
- Refresh the page if controls stop working

**Sliders not affecting the model:**
- Wait for the model to fully load
- Check that you're on the correct tab (Upper Body / Lower Body)
- Verify the joint exists for the detected person
- Check browser console for errors

## Performance Tips

- Use images with clear, well-lit subjects
- Smaller images process faster (but maintain quality)
- GPU acceleration significantly speeds up inference
- Close other 3D-intensive applications
- Use Chrome or Edge for best WebGL performance
- Use lightweight mode if you have 8GB or less VRAM

## License

This project is licensed under the MIT License. The SAM-3D-Body model is from Meta Research. Please refer to the original model's license for usage terms.

## Credits

- **SAM-3D-Body**: Meta AI Research
- **Radix UI**: Radix UI team
- **Three.js**: Three.js contributors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please open an issue on GitHub.
