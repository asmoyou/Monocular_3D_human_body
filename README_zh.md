# SAM 3D 人体编辑器

<div align="center">

基于 Meta SAM-3D-Body 模型的交互式 3D 人体姿态估计与编辑应用

[English](README.md) | [中文](#)

</div>

---

## 项目概述

SAM 3D 人体编辑器是一个基于 Web 的应用程序，允许用户上传图片，自动检测并重建 3D 人体模型，通过直观的关节控制系统交互式地操作人体姿态。使用 React 和 Flask 构建，通过 Three.js 提供实时 3D 可视化。

## 功能特性

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

## 技术栈

### 后端
- **Python 3.10+**: 核心语言
- **Flask**: REST API 服务器
- **SAM-3D-Body**: Meta 的 3D 人体姿态估计模型
- **OpenCV**: 图像处理
- **NumPy**: 数值计算

### 前端
- **React 18**: UI 框架
- **Radix UI**: 深色主题组件库
- **Three.js**: 3D 渲染和可视化
- **Vite**: 快速构建工具和开发服务器

## 环境要求

- Python 3.8-3.11
- Node.js 18+
- 支持 CUDA 的 GPU（推荐，8GB+ 显存）
- Conda (Anaconda/Miniconda) - 推荐用于环境管理

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/asmoyou/Monocular_3D_human_body.git
cd Monocular_3D_human_body
```

### 2. 后端设置

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

### 3. 前端设置

进入前端目录并安装依赖：

```bash
cd frontend
npm install
cd ..
```

## 使用方法

### 开发模式

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

### 生产模式

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

## 使用指南

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

## 显存优化

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

## 项目结构

```
Monocular_3D_human_body/
├── app.py                      # Flask 后端服务器
├── requirements.txt            # Python 依赖
├── LICENSE                     # MIT 许可证
├── README.md                   # 英文文档
├── README_zh.md                # 本文件（中文）
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

## API 接口

### `GET /api/health`
健康检查接口

**响应:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### `POST /api/process`
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

### `GET /api/sessions/<session_id>`
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

### `POST /api/measurements`
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

## 故障排查

### 后端问题

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

### 前端问题

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

## 性能优化建议

- 使用清晰、光照良好的主体图片
- 较小的图片处理更快（但保持质量）
- GPU 加速显著加快推理速度
- 关闭其他 3D 密集型应用程序
- 使用 Chrome 或 Edge 获得最佳 WebGL 性能
- 如果显存为 8GB 或更少，使用轻量级模式

## 许可证

本项目采用 MIT 许可证。SAM-3D-Body 模型来自 Meta Research。请参考原始模型的许可证以了解使用条款。

## 致谢

- **SAM-3D-Body**: Meta AI Research
- **Radix UI**: Radix UI 团队
- **Three.js**: Three.js 贡献者

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 支持

如果遇到任何问题，请在 GitHub 上提交 issue。

