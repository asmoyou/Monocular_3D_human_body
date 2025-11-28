# 更新总结 - Conda环境支持

## ✅ 已完成的更新

### 1. 启动脚本更新

所有Windows批处理脚本现在都会自动激活`sam_3d_body` conda环境：

#### `start.bat` (标准模式)
```batch
conda activate sam_3d_body
python app.py
```
- 显存占用: ~6-8GB
- 完整功能

#### `start-lightweight.bat` (轻量级模式) ⭐ 推荐
```batch
conda activate sam_3d_body
set LIGHTWEIGHT_MODE=true
python app.py
```
- 显存占用: ~4-5GB
- 禁用FOV估计器（对精度影响极小）

#### `check-memory.bat` (显存诊断)
```batch
conda activate sam_3d_body
python check_memory.py
```
- 检查不同模式的显存使用情况

### 2. 文档更新

#### README.md
- ✅ 更新安装说明使用conda
- ✅ 更新使用说明包含conda激活步骤
- ✅ 说明两种启动模式的区别

#### MEMORY_OPTIMIZATION.md
- ✅ 更新所有命令示例使用conda
- ✅ 说明显存优化策略

#### 新增 QUICK_START.md
- ✅ 快速参考卡片
- ✅ 常见问题解答
- ✅ 脚本使用说明

---

## 🚀 现在如何使用

### 最简单的方式：

```bash
# 双击运行（推荐轻量级模式）
start-lightweight.bat
```

这会自动：
1. ✅ 激活 `sam_3d_body` conda环境
2. ✅ 启动Flask后端（端口5000）
3. ✅ 启动React前端（端口5173）

### 手动方式：

```bash
# 终端1 - 后端
conda activate sam_3d_body
set LIGHTWEIGHT_MODE=true
python app.py

# 终端2 - 前端
cd frontend
npm run dev
```

---

## 📊 模式对比

| 模式 | 脚本 | 显存 | 功能 | 推荐场景 |
|------|------|------|------|---------|
| 标准 | `start.bat` | 6-8GB | 完整 | 12GB+显存 |
| 轻量 | `start-lightweight.bat` | 4-5GB | 99%功能 | **8GB显存** ⭐ |
| 诊断 | `check-memory.bat` | - | 检查工具 | 首次运行 |

---

## 🔧 技术细节

### 加载的模型

程序会加载以下模型（标准模式）：

1. **SAM-3D-Body主模型** (~2-3GB)
   - 3D姿态估计核心

2. **VitDet人物检测器** (~1-2GB)
   - 自动检测图片中的人物

3. **MoGe2 FOV估计器** (~1-2GB)
   - 估计相机视场角
   - ⚠️ 轻量级模式下禁用

4. **(可选) SAM2分割器** (~1-2GB)
   - 仅在需要时加载

### 轻量级模式如何工作

通过环境变量 `LIGHTWEIGHT_MODE=true` 触发：

```python
# app.py 第292行
if USE_LIGHTWEIGHT:
    estimator = setup_sam_3d_body(
        hf_repo_id="facebook/sam-3d-body-dinov3",
        fov_name=None  # 禁用FOV估计器
    )
```

**影响**:
- ✅ 节省 ~1-2GB 显存
- ✅ 启动更快
- ⚠️ FOV使用默认值（对大多数照片影响不大）

---

## 📝 环境要求

### 必需：
- ✅ Conda (Anaconda/Miniconda)
- ✅ Python 3.8-3.11
- ✅ Node.js 18+
- ✅ CUDA兼容GPU (推荐)

### 推荐：
- ✅ 8GB+ VRAM (使用轻量级模式)
- ✅ 12GB+ VRAM (使用标准模式)

### 如果显存不足：
参考 `MEMORY_OPTIMIZATION.md` 了解更多优化选项

---

## 🐛 常见问题

### Q1: 脚本报错 "conda不是内部或外部命令"
**A**: Conda未安装或未添加到PATH
```bash
# 检查conda是否安装
where conda

# 如果未找到，需要安装Anaconda或Miniconda
# 或者使用Anaconda Prompt运行脚本
```

### Q2: "Failed to activate conda environment 'sam_3d_body'"
**A**: 环境不存在，需要创建
```bash
conda create -n sam_3d_body python=3.10
conda activate sam_3d_body
pip install -r requirements.txt
```

### Q3: 启动后显存占用还是很高
**A**: 检查是否使用了轻量级模式
```bash
# 确认使用这个脚本
start-lightweight.bat

# 或手动设置
set LIGHTWEIGHT_MODE=true
python app.py
```

### Q4: 前端无法连接后端
**A**: 检查后端是否启动成功
1. 查看Flask窗口是否有错误
2. 访问 `http://localhost:5000/api/health`
3. 应该返回 `{"status":"healthy","model_loaded":true}`

---

## 📂 项目文件说明

### 启动脚本
- `start.bat` - 标准模式（6-8GB显存）
- `start-lightweight.bat` - 轻量级模式（4-5GB显存）⭐
- `check-memory.bat` - 显存诊断工具

### 配置文件
- `requirements.txt` - Python依赖
- `frontend/package.json` - Node.js依赖

### 文档
- `README.md` - 完整文档
- `QUICK_START.md` - 快速开始指南
- `MEMORY_OPTIMIZATION.md` - 显存优化详解
- `FIXES.md` - 问题修复记录
- `UPDATE_CONDA.md` - 本文件

### 源代码
- `app.py` - Flask后端
- `frontend/src/` - React前端

---

## ✨ 新特性

1. **自动环境管理**
   - 脚本自动激活conda环境
   - 错误检查和友好提示

2. **双模式支持**
   - 标准模式：完整功能
   - 轻量级模式：优化显存

3. **诊断工具**
   - 检查显存使用
   - 对比不同模式

4. **完善的文档**
   - 快速开始指南
   - 显存优化策略
   - 常见问题解答

---

## 🎯 下一步

1. **首次使用**:
   ```bash
   start-lightweight.bat
   ```

2. **检查显存**:
   ```bash
   check-memory.bat
   ```

3. **查看文档**:
   - 快速开始: `QUICK_START.md`
   - 完整文档: `README.md`
   - 显存优化: `MEMORY_OPTIMIZATION.md`

---

## 🙏 感谢使用

如有问题，请查看：
1. `QUICK_START.md` - 快速参考
2. `README.md` - 完整文档
3. `MEMORY_OPTIMIZATION.md` - 性能优化
4. 浏览器F12控制台 - 查看错误日志
