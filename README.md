# SAM 3D Body Editor / SAM 3D 人体编辑器

<div align="center">

An interactive web application for 3D human body pose estimation and manipulation using Meta's SAM-3D-Body model.

基于 Meta SAM-3D-Body 模型的交互式 3D 人体姿态估计与编辑应用

[English](#english) | [中文](#中文)

</div>

---

## English

### Overview

SAM 3D Body Editor is a web-based application that enables users to upload images, automatically detect and reconstruct 3D human body models, and interactively manipulate body poses through an intuitive joint control system. Built with React and Flask, it provides real-time 3D visualization using Three.js.

### Features

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

### Technology Stack

#### Backend
- **Python 3.10+**: Core language
- **Flask**: REST API server
- **SAM-3D-Body**: Meta's 3D human pose estimation model
- **OpenCV**: Image processing
- **NumPy**: Numerical computations

#### Frontend
- **React 18**: UI framework
- **Radix UI**: Component library with dark theme
- **Three.js**: 3D rendering and visualization
- **Vite**: Fast build tool and dev server

### Prerequisites

- Python 3.8-3.11
- Node.js 18+
- CUDA-compatible GPU (recommended, 8GB+ VRAM)
- Conda (Anaconda/Miniconda) - recommended for environment management

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/asmoyou/Monocular_3D_human_body.git
cd Monocular_3D_human_body
```

#### 2. Backend Setup

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

#### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
cd ..
```

### Usage

#### Development Mode

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

#### Production Mode

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

### How to Use

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

### Memory Optimization

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

### Project Structure

```
Monocular_3D_human_body/
├── app.py                      # Flask backend server
├── requirements.txt            # Python dependencies
├── LICENSE                     # MIT License
├── README.md                   # This file
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
            ├── JointControl.jsx    # Individual joint sliders
            └── MeasurementOverlay.jsx  # Measurement panel
```

### API Endpoints

#### `GET /api/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

#### `POST /api/process`
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

#### `GET /api/sessions/<session_id>`
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

#### `POST /api/measurements`
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

### Troubleshooting

#### Backend Issues

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

#### Frontend Issues

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

### Performance Tips

- Use images with clear, well-lit subjects
- Smaller images process faster (but maintain quality)
- GPU acceleration significantly speeds up inference
- Close other 3D-intensive applications
- Use Chrome or Edge for best WebGL performance
- Use lightweight mode if you have 8GB or less VRAM

### License

This project is licensed under the MIT License. The SAM-3D-Body model is from Meta Research. Please refer to the original model's license for usage terms.

### Credits

- **SAM-3D-Body**: Meta AI Research
- **Radix UI**: Radix UI team
- **Three.js**: Three.js contributors

---

## 中文

### 项目概述

SAM 3D 人体编辑器是一个基于 Web 的应用程序，允许用户上传图片，自动检测并重建 3D 人体模型，通过直观的关节控制系统交互式地操作人体姿态。使用 React 和 Flask 构建，通过 Three.js 提供实时 3D 可视化。

### 功能特性

- **🖼️ 图片上传**: 拖拽或点击上传图片（PNG, JPG, JPEG, WEBP）
- **🤖 自动检测**: 基于 SAM-3D-Body 的 AI 驱动 3D 人体姿态估计
- **🎮 交互式 3D 查看器**: 鼠标控制旋转、缩放和平移
- **🦴 关节操控**: 精确控制身体关节
  - 每个关节的 X、Y、Z 轴旋转滑块
  - 实时视觉反馈
  - 重置到原始姿态
- **👥 多人支持**: 在单张图片中检测和编辑多个人物
- **🌐 国际化**: 支持英文和中文界面
- **📏 身体测量**: 通过目标身高调整计算身体测量数据
- **💀 骨骼可视化**: 在 3D 网格上切换关节和骨骼叠加显示
- **🎨 现代 UI**: 使用 Radix UI 的深色主题界面

### 技术栈

#### 后端
- **Python 3.10+**: 核心语言
- **Flask**: REST API 服务器
- **SAM-3D-Body**: Meta 的 3D 人体姿态估计模型
- **OpenCV**: 图像处理
- **NumPy**: 数值计算

#### 前端
- **React 18**: UI 框架
- **Radix UI**: 深色主题组件库
- **Three.js**: 3D 渲染和可视化
- **Vite**: 快速构建工具和开发服务器

### 环境要求

- Python 3.8-3.11
- Node.js 18+
- 支持 CUDA 的 GPU（推荐，8GB+ 显存）
- Conda (Anaconda/Miniconda) - 推荐用于环境管理

### 安装步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/asmoyou/Monocular_3D_human_body.git
cd Monocular_3D_human_body
```

#### 2. 后端设置

创建并激活 conda 环境：

```bash
conda create -n sam_3d_body python=3.10
conda activate sam_3d_body
```

安装 Python 依赖：

```bash
pip install -r requirements.txt
```

**注意**: 首次运行会从 Hugging Face 下载约 2GB 的模型文件。请确保网络连接稳定。

#### 3. 前端设置

进入前端目录并安装依赖：

```bash
cd frontend
npm install
cd ..
```

### 使用方法

#### 开发模式

1. **启动后端服务器**（终端 1）：

```bash
conda activate sam_3d_body

# 标准模式（~6-8GB 显存）
python app.py

# 或轻量级模式（~4-5GB 显存，推荐用于 8GB GPU）
# Windows:
set LIGHTWEIGHT_MODE=true
python app.py

# Linux/Mac:
export LIGHTWEIGHT_MODE=true
python app.py
```

Flask 服务器将在 `http://localhost:5000` 启动

2. **启动前端开发服务器**（终端 2）：

```bash
cd frontend
npm run dev
```

Vite 开发服务器将在 `http://localhost:5173` 启动

3. **打开浏览器**并访问 `http://localhost:5173`

#### 生产模式

1. **构建前端**：

```bash
cd frontend
npm run build
```

2. **启动 Flask 服务器**：

```bash
conda activate sam_3d_body
python app.py
```

3. **访问应用**：`http://localhost:5000`

### 使用指南

1. **上传图片**
   - 点击上传区域或拖拽图片
   - 支持格式：PNG, JPG, JPEG, WEBP
   - 最大大小：16MB
   - 如果最长边超过 2048px，图片会自动调整大小

2. **查看 3D 模型**
   - 检测到的人物将显示在 3D 查看器中
   - **鼠标控制**：
     - 左键 + 拖拽：旋转相机
     - 右键 + 拖拽：平移视图
     - 滚轮：缩放

3. **调整姿态**
   - 选择"上半身"或"下半身"标签页
   - 每个关节有三个滑块（X、Y、Z 旋转轴）
   - 拖动滑块调整关节角度
   - 在 3D 查看器中实时查看更新

4. **身体测量**
   - 点击查看器工具栏中的测量按钮
   - 输入目标身高（可选）
   - 查看计算的身体测量数据
   - 导出测量数据为 CSV

5. **重置姿态**
   - 点击"重置"按钮返回原始姿态

6. **多人选择**
   - 如果检测到多个人物，从下拉菜单中选择要编辑的人物

7. **显示选项**
   - 切换关节可视化（红色球体）
   - 切换骨骼可视化（蓝色线条）

8. **语言切换**
   - 点击右上角的语言图标（🌐）在英文和中文之间切换

### 显存优化

应用程序会加载多个深度学习模型：

1. **SAM-3D-Body 主模型**（~2-3GB 显存）
2. **人物检测器 (VitDet)**（~1-2GB 显存）
3. **FOV 估计器 (MoGe2)**（~1-2GB 显存）- *轻量级模式下禁用*

**总显存使用**：
- 标准模式：~6-8GB
- 轻量级模式：~4-5GB（推荐用于 8GB GPU）

要使用轻量级模式，请在启动前设置环境变量：

```bash
# Windows
set LIGHTWEIGHT_MODE=true

# Linux/Mac
export LIGHTWEIGHT_MODE=true
```

### 项目结构

```
Monocular_3D_human_body/
├── app.py                      # Flask 后端服务器
├── requirements.txt            # Python 依赖
├── LICENSE                     # MIT 许可证
├── README.md                   # 本文件
├── notebook/                    # Jupyter notebook 工具
│   ├── utils.py               # 模型设置工具
│   └── demo_human.ipynb       # 演示 notebook
├── sam_3d_body/                # SAM-3D-Body 模型包
│   ├── data/                   # 数据转换和工具
│   ├── models/                 # 模型架构
│   ├── measurements/           # 身体测量计算
│   └── visualization/          # 可视化工具
├── tools/                      # 模型构建工具
└── frontend/                   # React 前端
    ├── package.json           # Node.js 依赖
    ├── vite.config.js         # Vite 配置
    ├── index.html             # HTML 入口
    └── src/
        ├── main.jsx           # React 入口
        ├── App.jsx            # 主应用组件
        ├── i18n.js            # 国际化
        └── components/
            ├── UploadPanel.jsx      # 图片上传 UI
            ├── ViewerPanel.jsx      # Three.js 3D 查看器
            ├── ControlPanel.jsx     # 关节控制容器
            ├── JointControl.jsx     # 单个关节滑块
            └── MeasurementOverlay.jsx  # 测量面板
```

### API 接口

#### `GET /api/health`
健康检查接口

**响应:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

#### `POST /api/process`
处理上传的图片并返回 3D 骨骼数据

**请求:**
- 方法: POST
- Content-Type: multipart/form-data
- 请求体: `image` 文件

**响应:**
```json
{
  "success": true,
  "session_id": "uuid",
  "status": "queued"
}
```

#### `GET /api/sessions/<session_id>`
获取处理状态和结果

**响应:**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "num_persons": 1,
  "rig_data": [...]
}
```

#### `POST /api/measurements`
计算身体测量数据

**请求:**
```json
{
  "session_id": "uuid",
  "person_index": 0,
  "target_height_cm": 175.0
}
```

**响应:**
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

### 故障排查

#### 后端问题

**模型加载两次 / 显存占用高:**
- 应用即使在调试模式下也只加载一次模型
- 如果仍然看到高显存占用，尝试在 app.py 中使用 `debug=False` 运行

**模型未加载:**
- 确保网络连接稳定（模型从 Hugging Face 下载）
- 如果使用 GPU，检查 GPU/CUDA 可用性
- 首次运行会下载约 2GB 模型 - 这是正常的

**图片处理失败:**
- 验证图片格式是否支持（PNG, JPG, JPEG, WEBP）
- 检查图片大小（如果 > 2048px 会自动调整）
- 确保图片中包含可见的人物

**"Momentum is not enabled" 警告:**
- 这是来自模型的无害警告，可以安全忽略

#### 前端问题

**3D 模型未显示:**
- 检查浏览器控制台是否有错误（F12 → 控制台标签）
- 查看控制台中 `[Viewer]` 前缀的消息
- 验证后端是否在端口 5000 上运行
- 尝试不同的图片
- 检查浏览器是否启用了 WebGL

**无法控制相机 / 视图:**
- 确保模型已加载完成
- 尝试先点击画布区域
- 检查控制台中的 OrbitControls 初始化消息
- 如果控制停止工作，刷新页面

**滑块不影响模型:**
- 等待模型完全加载
- 检查是否在正确的标签页（上半身 / 下半身）
- 验证检测到的人物是否存在该关节
- 检查浏览器控制台是否有错误

### 性能优化建议

- 使用清晰、光照良好的主体图片
- 较小的图片处理更快（但保持质量）
- GPU 加速显著加快推理速度
- 关闭其他 3D 密集型应用程序
- 使用 Chrome 或 Edge 获得最佳 WebGL 性能
- 如果显存为 8GB 或更少，使用轻量级模式

### 许可证

本项目采用 MIT 许可证。SAM-3D-Body 模型来自 Meta Research。请参考原始模型的许可证以了解使用条款。

### 致谢

- **SAM-3D-Body**: Meta AI Research
- **Radix UI**: Radix UI 团队
- **Three.js**: Three.js 贡献者

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

欢迎贡献！请随时提交 Pull Request。

## Support

If you encounter any issues, please open an issue on GitHub.

如果遇到任何问题，请在 GitHub 上提交 issue。
