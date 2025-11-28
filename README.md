# SAM 3D Body Editor

An interactive web application for 3D human body pose estimation and manipulation. Upload an image, detect people, and manually adjust their body poses with an intuitive joint control system.

## Features

- **Image Upload**: Drag & drop or click to upload images
- **3D Body Detection**: Automatic 3D human pose estimation using SAM-3D-Body
- **Interactive 3D Viewer**: Rotate, zoom, and pan the 3D model with OrbitControls
- **Joint Manipulation**: Manually control each body joint (shoulders, elbows, hips, knees, etc.)
  - X, Y, Z axis rotation sliders for each joint
  - Real-time visual feedback
  - Reset pose to original
- **Multi-Person Support**: Detect and edit multiple people in a single image
- **Dark Theme**: Beautiful dark UI using Radix UI
- **Skeleton Visualization**: See bones and joints overlaid on the 3D mesh

## Technology Stack

### Backend
- **Python Flask**: REST API server
- **SAM-3D-Body**: Meta's 3D human pose estimation model
- **OpenCV**: Image processing
- **NumPy**: Numerical computations

### Frontend
- **React 18**: UI framework
- **Radix UI**: Component library with dark theme
- **Three.js**: 3D rendering and visualization
- **Vite**: Fast build tool and dev server

## Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- GPU recommended for faster inference

### Backend Setup

1. Create a conda environment (recommended):
```bash
conda create -n sam_3d_body python=3.10
conda activate sam_3d_body
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

**Note:** If you already have a conda environment named `sam_3d_body`, the startup scripts will automatically activate it.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## Usage

### Quick Start (Windows)

**Standard Mode** (~6-8GB VRAM):
```bash
start.bat
```

**Lightweight Mode** (~4-5GB VRAM, recommended):
```bash
start-lightweight.bat
```

Both scripts will automatically:
1. Activate the `sam_3d_body` conda environment
2. Start the Flask backend server
3. Start the React frontend dev server

### Development Mode (Manual)

1. **Start the backend server** (from project root):
```bash
# Activate conda environment first
conda activate sam_3d_body

# Standard mode
python app.py

# OR Lightweight mode (saves ~2GB VRAM)
set LIGHTWEIGHT_MODE=true  # Windows
export LIGHTWEIGHT_MODE=true  # Linux/Mac
python app.py
```
The Flask server will start on `http://localhost:5000`

**Note:** You may see a warning "Momentum is not enabled" - this is normal and can be ignored.

2. **Start the frontend dev server** (in a new terminal):
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
python app.py
```

3. **Access the app** at `http://localhost:5000`

## How to Use

1. **Upload an Image**
   - Click the upload zone or drag & drop an image
   - Supported formats: PNG, JPG, JPEG, WEBP
   - Max size: 16MB

2. **View 3D Model**
   - The detected person(s) will appear in the 3D viewer
   - Use mouse to rotate (left click), pan (right click), zoom (scroll)

3. **Adjust Pose**
   - Select "Upper Body" or "Lower Body" tab
   - Each joint has three sliders (X, Y, Z rotation axes)
   - Drag sliders to adjust joint angles
   - See real-time updates in the 3D viewer

4. **Reset Pose**
   - Click the "Reset" button to return to original pose

5. **Multi-Person Selection**
   - If multiple people are detected, select which person to edit

## Project Structure

```
sam-3d-body-demo/
├── app.py                  # Flask backend server
├── inference-demo.py       # Model inference utilities
├── requirements.txt        # Python dependencies
├── uploads/               # Uploaded images (auto-created)
├── outputs/               # Generated 3D rig data (auto-created)
└── frontend/
    ├── package.json       # Node.js dependencies
    ├── vite.config.js     # Vite configuration
    ├── index.html         # HTML entry point
    └── src/
        ├── main.jsx       # React entry point
        ├── App.jsx        # Main app component
        ├── App.css        # App styles
        ├── index.css      # Global styles
        └── components/
            ├── UploadPanel.jsx      # Image upload UI
            ├── ViewerPanel.jsx      # 3D viewer with Three.js
            ├── ControlPanel.jsx     # Joint controls container
            └── JointControl.jsx     # Individual joint sliders
```

## API Endpoints

### `GET /api/health`
Health check endpoint

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
  "num_persons": 1,
  "rig_data": [...]
}
```

## Troubleshooting

### Backend Issues

**Model loading twice / High memory usage:**
- Fixed: The app now only loads the model once, even in debug mode
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

**Error messages not showing:**
- Now implemented! Check the 3D viewer area for red error boxes
- Also check browser console for detailed error logs

### Performance Tips

- Use images with clear, well-lit subjects
- Smaller images process faster (but maintain quality)
- GPU acceleration significantly speeds up inference
- Close other 3D-intensive applications
- Use Chrome or Edge for best WebGL performance

### Debug Tips

1. **Backend debugging:**
   - All processing logs are printed to console
   - Check for "Successfully processed X person(s)" message
   - Rig data is saved in `outputs/<session_id>/` folder

2. **Frontend debugging:**
   - Open browser DevTools (F12)
   - Check Console tab for `[Viewer]` messages
   - Network tab shows API requests to `/api/process`
   - Look for any red error messages in the viewer

3. **Common fixes:**
   - Refresh the browser page
   - Restart both backend and frontend servers
   - Clear browser cache
   - Delete `uploads/` and `outputs/` folders and retry

## License

This project uses the SAM-3D-Body model from Meta Research. Please refer to the original model's license for usage terms.

## Credits

- **SAM-3D-Body**: Meta AI Research
- **Radix UI**: Radix UI team
- **Three.js**: Three.js contributors
