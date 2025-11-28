# 显存问题诊断与解决方案

## 问题分析

### 为什么显存占用这么高？

SAM-3D-Body实际上加载了**4个独立的深度学习模型**：

1. **SAM-3D-Body主模型** (~2-3GB VRAM)
   - 用于3D人体姿态估计和网格生成

2. **Human Detector (VitDet)** (~1-2GB VRAM)
   - 用于在图片中检测人物位置
   - 生成边界框(bounding boxes)

3. **Human Segmentor (SAM2)** (~1-2GB VRAM)
   - 仅在提供`segmentor_path`时加载
   - 用于精确的人物分割

4. **FOV Estimator (MoGe2)** (~1-2GB VRAM)
   - 用于估计相机视场角(Field of View)
   - 提高深度估计准确性

**总计：~6-8GB VRAM (完整模式)**

这比单独运行`inference-demo.py`消耗更多显存的原因是：
- `inference-demo.py`可能在运行后立即释放了部分模型
- Web服务器需要保持所有模型常驻内存以快速响应请求

---

## 解决方案

### 方案1: 轻量级模式 (推荐)

禁用FOV估计器，使用默认FOV值。这可以节省~1-2GB VRAM，准确度损失很小。

**使用方法:**

Windows (自动激活conda环境):
```bash
start-lightweight.bat
```

或手动设置环境变量:
```bash
conda activate sam_3d_body
set LIGHTWEIGHT_MODE=true
python app.py
```

Linux/Mac:
```bash
conda activate sam_3d_body
export LIGHTWEIGHT_MODE=true
python app.py
```

**预期显存: ~4-5GB**

---

### 方案2: 进一步优化 - 禁用人物检测器

如果你每次只处理包含单个人的图片，可以禁用人物检测器。

修改`app.py`第301行:
```python
estimator = setup_sam_3d_body(
    hf_repo_id="facebook/sam-3d-body-dinov3",
    detector_name=None,  # 禁用人物检测
    fov_name=None        # 禁用FOV估计
)
```

**预期显存: ~3-4GB**

**限制:**
- 图片必须只包含一个人
- 需要手动提供边界框或使用全图

---

### 方案3: 使用CPU (不推荐，非常慢)

修改`app.py`第301行:
```python
estimator = setup_sam_3d_body(
    hf_repo_id="facebook/sam-3d-body-dinov3",
    device="cpu"  # 使用CPU
)
```

**预期显存: 0GB**
**处理时间: 10-30倍慢**

---

## 如何检查显存使用情况

运行诊断脚本:
```bash
python check_memory.py
```

这会显示:
- 加载前的显存使用
- 完整模式的显存使用
- 轻量级模式的显存使用
- 各个组件的详细信息

---

## Three.js渲染问题修复

### 问题: `skinning` 属性警告

```
THREE.Material: 'skinning' is not a property of THREE.MeshStandardMaterial.
```

**原因:** Three.js r162+版本已废弃`skinning`属性，SkinnedMesh会自动处理蒙皮。

**已修复:** 移除了材质配置中的`skinning: true`

---

## 模型未显示问题

根据你的日志：
```
[Viewer] Mesh vertices: 18439
[Viewer] Mesh faces: 36874
[Viewer] Skeleton joints: 127
[Viewer] Geometry created
[Viewer] Created 127 bones
[Viewer] Skinned mesh added to scene
[Viewer] Skeleton helpers added
```

模型实际上已经加载成功！但可能没有显示。

### 可能的原因

1. **相机位置不对** - 已添加自动聚焦
2. **材质问题** - 已修复skinning属性
3. **骨骼绑定问题** - 检查控制台是否有skeleton相关错误

### 调试步骤

1. 打开浏览器控制台 (F12)
2. 查看是否有红色错误信息
3. 检查是否看到以下完整日志序列:
   ```
   [Viewer] Initializing Three.js scene
   [Viewer] OrbitControls initialized
   [Viewer] Animation loop started
   [Viewer] Loading rig data
   [Viewer] Geometry created
   [Viewer] Created 127 bones
   [Viewer] Skinned mesh added to scene
   [Viewer] Camera focused on mesh
   ```

4. 在控制台运行以下命令检查场景:
   ```javascript
   // 检查场景中的对象
   console.log(window.__threeScene)

   // 如果看到undefined，刷新页面重试
   ```

---

## 启动检查清单

### 后端启动检查

运行`python app.py`后，应该看到:

```
[DEBUG] WERKZEUG_RUN_MAIN = true
[DEBUG] app.debug = True
[DEBUG] Loading model in main process...
============================================================
Loading SAM-3D-Body model (this may take a moment)...
This will load multiple models and consume ~6-8GB VRAM
============================================================
Loading SAM 3D Body model from facebook/sam-3d-body-dinov3...
Loading human detector from vitdet...
Loading FOV estimator from moge2...
Setup complete!
  Human detector: OK
  Human segmentor: OFF (mask inference disabled)
  FOV estimator: OK
Extracting skeleton template...
============================================================
Model loaded successfully!
============================================================
```

**关键点:**
- 只看到**一次**模型加载日志
- 如果看到两次，说明reloader还在重复加载

### 前端启动检查

访问`http://localhost:5173`后，控制台应该显示:

```
[Viewer] Initializing Three.js scene
[Viewer] OrbitControls initialized  ← 这个很重要！
[Viewer] Animation loop started
```

如果看到这些，说明3D引擎正常工作。

---

## 推荐配置

根据你的8GB显存:

### 配置1: 标准模式 (紧张但可用)
```bash
python app.py
```
- 显存占用: ~6-7GB
- 准确度: 最高
- 剩余显存: ~1-2GB (可能有点紧张)

### 配置2: 轻量级模式 (推荐)
```bash
start-lightweight.bat
```
- 显存占用: ~4-5GB
- 准确度: 略微降低(FOV使用默认值)
- 剩余显存: ~3-4GB (比较舒适)

### 配置3: 极限轻量 (需手动修改代码)
- 显存占用: ~3-4GB
- 准确度: 中等(仅适合单人照片)
- 剩余显存: ~4-5GB (最舒适)

---

## 性能对比

| 模式 | 显存占用 | 处理速度 | 准确度 | 适用场景 |
|------|---------|---------|--------|---------|
| 完整模式 | 6-8GB | 快 | 最高 | 多人照片、复杂场景 |
| 轻量级模式 | 4-5GB | 快 | 高 | 大多数场景 |
| 极限轻量 | 3-4GB | 中等 | 中 | 单人照片 |
| CPU模式 | 0GB | 很慢 | 最高 | 无GPU可用 |

---

## 下一步

1. **首先运行诊断:**
   ```bash
   python check_memory.py
   ```

2. **根据显存情况选择模式:**
   - 如果有>=8GB显存 → 使用标准模式
   - 如果有6-8GB显存 → 使用轻量级模式 (推荐)
   - 如果有<6GB显存 → 使用极限轻量或CPU模式

3. **测试渲染:**
   - 上传图片
   - 检查浏览器控制台日志
   - 确认看到完整的日志序列
   - 尝试拖动鼠标控制视角

4. **如果还有问题:**
   - 提供完整的控制台日志
   - 提供后端终端输出
   - 说明具体的错误现象
