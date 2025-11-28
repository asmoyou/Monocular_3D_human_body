import json
import os
import time
import uuid
from collections import defaultdict
from pathlib import Path
from queue import Queue
from threading import Lock, Thread

import cv2
import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from notebook.utils import setup_sam_3d_body
from sam_3d_body.metadata.mhr70 import pose_info as mhr70_pose_info
from sam_3d_body.measurements import compute_measurements, MeasurementError

app = Flask(__name__, static_folder='frontend/dist')
CORS(app)

UPLOAD_FOLDER = Path("uploads")
OUTPUT_FOLDER = Path("outputs")
UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

# ---------------------------------------------------------------------------
# Rigged export helpers (integrated from inference-demo.py)
# ---------------------------------------------------------------------------

def rotate_points_x(points: np.ndarray) -> np.ndarray:
    """Rotate points for coordinate system conversion."""
    rotated = np.array(points, dtype=np.float32, copy=True)
    rotated[..., 1] *= -1.0
    rotated[..., 2] *= -1.0
    return rotated


def _build_mhr70_skeleton():
    """Build skeleton structure from MHR70 metadata."""
    kp_info = mhr70_pose_info["keypoint_info"]
    skeleton_info = mhr70_pose_info["skeleton_info"]

    joint_names = [kp_info[i]["name"] for i in range(len(kp_info))]
    name_to_idx = {name: idx for idx, name in enumerate(joint_names)}

    adjacency = {idx: [] for idx in range(len(joint_names))}
    for link_def in skeleton_info.values():
        joint_a, joint_b = link_def["link"]
        ia, ib = name_to_idx[joint_a], name_to_idx[joint_b]
        adjacency[ia].append(ib)
        adjacency[ib].append(ia)

    root_name = "neck" if "neck" in name_to_idx else joint_names[0]
    root_idx = name_to_idx[root_name]
    parents = [-1] * len(joint_names)
    queue = [root_idx]
    visited = {root_idx}

    while queue:
        current = queue.pop(0)
        for nb in adjacency[current]:
            if nb in visited:
                continue
            parents[nb] = current
            visited.add(nb)
            queue.append(nb)

    return joint_names, parents


MHR70_NAMES, _ = _build_mhr70_skeleton()
MHR70_NAME_TO_IDX = {name: idx for idx, name in enumerate(MHR70_NAMES)}

# Use ALL keypoint names for animation targets (including fingers)
ANIMATION_NAMES = MHR70_NAMES


def extract_mhr_template(mhr_module, max_influences=4):
    """Extract skeleton and skinning data from MHR module."""
    buffers = dict(mhr_module.named_buffers())

    joint_parents = (
        buffers["character_torch.skeleton.joint_parents"].detach().cpu().numpy().astype(np.int32)
    )
    joint_offsets = (
        buffers["character_torch.skeleton.joint_translation_offsets"].detach().cpu().numpy()
        / 100.0
    )
    joint_offsets = rotate_points_x(joint_offsets)
    num_vertices = int(buffers["character_torch.mesh.rest_vertices"].shape[0])

    vert_indices = (
        buffers["character_torch.linear_blend_skinning.vert_indices_flattened"]
        .detach()
        .cpu()
        .numpy()
        .astype(np.int64)
    )
    skin_indices = (
        buffers["character_torch.linear_blend_skinning.skin_indices_flattened"]
        .detach()
        .cpu()
        .numpy()
        .astype(np.int64)
    )
    skin_weights = (
        buffers["character_torch.linear_blend_skinning.skin_weights_flattened"]
        .detach()
        .cpu()
        .numpy()
        .astype(np.float32)
    )

    per_vertex = defaultdict(list)
    for vid, jid, weight in zip(vert_indices, skin_indices, skin_weights):
        per_vertex[int(vid)].append((float(weight), int(jid)))

    skin_index_array = np.zeros((num_vertices, max_influences), dtype=np.int32)
    skin_weight_array = np.zeros((num_vertices, max_influences), dtype=np.float32)

    for vid in range(num_vertices):
        entries = per_vertex.get(vid, [])
        if not entries:
            continue
        entries.sort(key=lambda item: item[0], reverse=True)
        selected = entries[:max_influences]
        total = sum(weight for weight, _ in selected) or 1.0
        for slot, (weight, jid) in enumerate(selected):
            skin_index_array[vid, slot] = jid
            skin_weight_array[vid, slot] = weight / total

    # Use MHR70_NAMES for proper joint naming instead of generic joint_{idx}
    joint_names = MHR70_NAMES[:len(joint_parents)] if len(MHR70_NAMES) >= len(joint_parents) else [f"joint_{idx}" for idx in range(len(joint_parents))]
    root_index = int(np.where(joint_parents == -1)[0][0])

    print(f"[Extract] Using {len(joint_names)} joint names from MHR70_NAMES")
    print(f"[Extract] Sample joint names: {joint_names[:10]}")

    return {
        "joint_names": joint_names,
        "joint_parents": joint_parents,
        "joint_offsets": joint_offsets,
        "skin_indices": skin_index_array,
        "skin_weights": skin_weight_array,
        "root_index": root_index,
    }


def match_keypoints_to_joints(keypoints, joint_positions):
    """Map semantic keypoints to skeleton joints."""
    target_mapping = {}

    # Map all available keypoints to nearest joints
    for name, kp_idx in MHR70_NAME_TO_IDX.items():
        if kp_idx >= len(keypoints):
            continue

        target_pos = keypoints[kp_idx]
        dists = np.linalg.norm(joint_positions - target_pos[None, :], axis=1)
        target_mapping[name] = int(np.argmin(dists))

    return target_mapping


def prepare_person_rig(person_output, template):
    """Prepare rig data for a single person."""
    vertices = np.array(person_output["pred_vertices"], dtype=np.float32)
    joint_positions = np.array(person_output["pred_joint_coords"], dtype=np.float32)
    joint_positions = joint_positions[: template["joint_parents"].shape[0]]
    keypoints = np.array(person_output["pred_keypoints_3d"], dtype=np.float32)

    cam_t = person_output.get("pred_cam_t")
    if cam_t is not None:
        vertices = vertices + cam_t
        joint_positions = joint_positions + cam_t
        keypoints = keypoints + cam_t

    root_idx = template["root_index"]
    root_offset = joint_positions[root_idx].copy()

    vertices = vertices - root_offset
    joint_positions = joint_positions - root_offset
    keypoints = keypoints - root_offset

    vertices = rotate_points_x(vertices)
    joint_positions = rotate_points_x(joint_positions)
    keypoints = rotate_points_x(keypoints)
    root_offset = rotate_points_x(root_offset[None])[0]

    target_mapping = match_keypoints_to_joints(keypoints, joint_positions)

    return {
        "vertices": np.round(vertices, 6),
        "joint_positions": np.round(joint_positions, 6),
        "keypoints": np.round(keypoints, 6),
        "target_mapping": target_mapping,
        "root_offset": root_offset,
    }


def export_rigged_models(predictions, faces, rig_template, export_dir="meshes"):
    """Export rigged models with skeleton and skinning data."""
    os.makedirs(export_dir, exist_ok=True)
    rig_files = []
    skin_indices_serialized = rig_template["skin_indices"].tolist()
    skin_weights_serialized = rig_template["skin_weights"].tolist()

    print(f"[Export] Total keypoint names in MHR70: {len(MHR70_NAMES)}")
    print(f"[Export] Keypoint names: {MHR70_NAMES}")

    # Identify head joint index (MHR template often stores head around joint_112/113)
    head_joint_idx = None
    head_name_candidates = ["head", "joint_113", "joint_112"]
    for candidate in head_name_candidates:
        if candidate in rig_template["joint_names"]:
            head_joint_idx = rig_template["joint_names"].index(candidate)
            print(f"[Export] Head joint candidate '{candidate}' found at index {head_joint_idx}")
            break

    for idx, person_output in enumerate(predictions, start=1):
        rig_info = prepare_person_rig(person_output, rig_template)

        print(f"[Export] Person {idx} animation_targets keys: {list(rig_info['target_mapping'].keys())}")
        print(f"[Export] Person {idx} total animation targets: {len(rig_info['target_mapping'])}")

        # Ensure head control is available even if MHR70 metadata lacks explicit head joint
        if head_joint_idx is not None and "head" not in rig_info["target_mapping"]:
            rig_info["target_mapping"]["head"] = head_joint_idx
            print(f"[Export] Person {idx} - Added synthetic 'head' target at joint index {head_joint_idx}")

        # Create better joint names using animation_targets mapping
        # Map skeleton joint indices to MHR70 keypoint names where available
        joint_idx_to_name = {}
        for kp_name, joint_idx in rig_info["target_mapping"].items():
            if joint_idx not in joint_idx_to_name:
                joint_idx_to_name[joint_idx] = kp_name
        
        # Build joint_names array: use mapped names where available, otherwise use joint_{idx}
        improved_joint_names = []
        for joint_idx in range(len(rig_template["joint_names"])):
            if joint_idx in joint_idx_to_name:
                improved_joint_names.append(joint_idx_to_name[joint_idx])
            else:
                # Use original name if it's not joint_{idx}, otherwise keep joint_{idx}
                original_name = rig_template["joint_names"][joint_idx]
                if original_name.startswith("joint_"):
                    improved_joint_names.append(original_name)
                else:
                    improved_joint_names.append(original_name)

        rig_payload = {
            "mesh": {
                "vertices": rig_info["vertices"].tolist(),
                "faces": faces.astype(int).tolist(),
                "skinIndices": skin_indices_serialized,
                "skinWeights": skin_weights_serialized,
            },
            "skeleton": {
                "joint_names": improved_joint_names,
                "parents": rig_template["joint_parents"].tolist(),
                "rest_offsets": rig_template["joint_offsets"].tolist(),
                "joint_positions": rig_info["joint_positions"].tolist(),
            },
            "animation_targets": rig_info["target_mapping"],
            "keypoints": [
                {"name": name, "position": rig_info["keypoints"][kp_idx].tolist()}
                for name, kp_idx in MHR70_NAME_TO_IDX.items()
            ],
            "metadata": {
                "focal_length": float(person_output["focal_length"]),
                "bbox": person_output["bbox"].tolist(),
                "root_translation": rig_info["root_offset"].tolist(),
            },
        }

        rig_path = os.path.join(export_dir, f"person_{idx}_rig.json")
        with open(rig_path, "w", encoding="utf-8") as f:
            json.dump(rig_payload, f, indent=2)
        rig_files.append(rig_path)

    return rig_files


# ---------------------------------------------------------------------------
# Initialize model (only once, not during Flask reloader)
# ---------------------------------------------------------------------------
estimator = None
RIG_TEMPLATE = None
SESSION_STORE = {}
SESSION_LOCK = Lock()
PROCESS_QUEUE = Queue()
WORKER_THREAD = None

def init_model():
    """Initialize model - called only once

    Note: This loads multiple models which consume GPU memory:
    - SAM-3D-Body main model (~2-3GB)
    - Human Detector (VitDet) (~1-2GB)
    - FOV Estimator (MoGe2) (~1-2GB)
    Total: ~4-7GB VRAM

    Set USE_LIGHTWEIGHT=True to reduce memory usage (disable FOV estimator)
    """
    global estimator, RIG_TEMPLATE
    if estimator is None:
        print("=" * 60)
        print("Loading SAM-3D-Body model (this may take a moment)...")
        print("This will load multiple models and consume ~6-8GB VRAM")
        print("=" * 60)

        # Set to True to reduce VRAM usage (disables FOV estimation, uses default FOV)
        USE_LIGHTWEIGHT = os.environ.get('LIGHTWEIGHT_MODE', 'false').lower() == 'true'

        if USE_LIGHTWEIGHT:
            print("[LIGHTWEIGHT MODE] Disabling FOV estimator to save VRAM")
            estimator = setup_sam_3d_body(
                hf_repo_id="facebook/sam-3d-body-dinov3",
                fov_name=None  # Disable FOV estimator
            )
        else:
            estimator = setup_sam_3d_body(hf_repo_id="facebook/sam-3d-body-dinov3")

        print("Extracting skeleton template...")
        RIG_TEMPLATE = extract_mhr_template(estimator.model.head_pose.mhr)

        print("=" * 60)
        print("Model loaded successfully!")
        print("=" * 60)
    else:
        print("Model already loaded, skipping initialization")


def start_worker():
    """Start background worker thread if not already running."""
    global WORKER_THREAD
    if WORKER_THREAD and WORKER_THREAD.is_alive():
        return

    def worker_loop():
        while True:
            session_id = PROCESS_QUEUE.get()
            try:
                process_session_job(session_id)
            except Exception as worker_exc:
                print(f"[Worker] Error executing session {session_id}: {worker_exc}")
            finally:
                PROCESS_QUEUE.task_done()

    WORKER_THREAD = Thread(target=worker_loop, daemon=True)
    WORKER_THREAD.start()


# Load model immediately when not in reloader process
# This ensures the model is only loaded ONCE
print(f"[DEBUG] WERKZEUG_RUN_MAIN = {os.environ.get('WERKZEUG_RUN_MAIN')}")
print(f"[DEBUG] app.debug = {app.debug}")

if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
    print("[DEBUG] Loading model in main process...")
    init_model()
    start_worker()
else:
    print("[DEBUG] Skipping model load in reloader process")


# ---------------------------------------------------------------------------
# Flask routes
# ---------------------------------------------------------------------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def register_session(session_id, filepath, session_dir, original_filename):
    with SESSION_LOCK:
        SESSION_STORE[session_id] = {
            "session_id": session_id,
            "status": "queued",
            "created_at": time.time(),
            "updated_at": time.time(),
            "filepath": str(filepath),
            "session_dir": str(session_dir),
            "original_filename": original_filename,
            "num_persons": 0,
            "rig_data": None,
            "error": None,
        }


def update_session(session_id, **kwargs):
    with SESSION_LOCK:
        session = SESSION_STORE.get(session_id)
        if not session:
            return None
        session.update(kwargs)
        session["updated_at"] = time.time()
        return session


def process_session_job(session_id):
    """Background worker that performs long-running inference."""
    session = SESSION_STORE.get(session_id)
    if not session:
        print(f"[Worker] Missing session {session_id}")
        return

    update_session(session_id, status="processing")
    filepath = Path(session["filepath"])
    session_dir = Path(session["session_dir"])

    try:
        if estimator is None:
            init_model()

        img_bgr = cv2.imread(str(filepath))
        if img_bgr is None:
            raise RuntimeError("Could not read image file")

        MAX_LONG_EDGE = 2048
        height, width = img_bgr.shape[:2]
        long_edge = max(height, width)
        if long_edge > MAX_LONG_EDGE:
            scale = MAX_LONG_EDGE / long_edge
            new_size = (int(width * scale), int(height * scale))
            print(f"[Worker] Resizing {session_id} from {width}x{height} to {new_size[0]}x{new_size[1]}")
            img_bgr = cv2.resize(img_bgr, new_size, interpolation=cv2.INTER_AREA)

        print(f"[Worker] Processing session {session_id}")
        outputs = estimator.process_one_image(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
        if not outputs:
            raise RuntimeError("No persons detected in image")

        rig_paths = export_rigged_models(
            outputs,
            estimator.faces,
            RIG_TEMPLATE,
            export_dir=str(session_dir)
        )

        if not rig_paths:
            raise RuntimeError("Failed to generate rig data")

        rig_data_list = []
        for rig_path in rig_paths:
            with open(rig_path, 'r', encoding='utf-8') as f:
                rig_data_list.append(json.load(f))

        update_session(
            session_id,
            status="completed",
            num_persons=len(rig_data_list),
            rig_data=rig_data_list,
            error=None,
        )
        print(f"[Worker] Session {session_id} completed ({len(rig_data_list)} person)")

    except Exception as exc:
        print(f"[Worker] Session {session_id} failed: {exc}")
        update_session(session_id, status="failed", error=str(exc))


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "model_loaded": True})


@app.route('/api/process', methods=['POST'])
def process_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, webp"}), 400

    try:
        # Generate unique ID for this session
        session_id = str(uuid.uuid4())
        session_dir = OUTPUT_FOLDER / session_id
        session_dir.mkdir(exist_ok=True)

        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = UPLOAD_FOLDER / f"{session_id}_{filename}"
        file.save(filepath)

        register_session(session_id, filepath, session_dir, filename)
        PROCESS_QUEUE.put(session_id)

        return jsonify({
            "success": True,
            "session_id": session_id,
            "status": "queued"
        }), 202

    except Exception as e:
        print(f"Error processing image: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session_status(session_id):
    session = SESSION_STORE.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    payload = {
        "session_id": session_id,
        "status": session.get("status", "unknown"),
        "num_persons": session.get("num_persons", 0),
        "error": session.get("error"),
    }
    if session.get("status") == "completed":
        payload["rig_data"] = session.get("rig_data", [])

    return jsonify(payload)


@app.route('/api/sessions/<session_id>/<filename>')
def get_session_file(session_id, filename):
    """Serve files from session directory"""
    try:
        return send_from_directory(
            OUTPUT_FOLDER / session_id,
            filename
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 404


@app.route('/api/measurements', methods=['POST'])
def calculate_measurements():
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON payload"}), 400

    session_id = payload.get("session_id")
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    session = SESSION_STORE.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404

    if session.get("status") != "completed":
        return jsonify({"error": "Session is not ready"}), 409

    rig_data = session.get("rig_data") or []

    try:
        person_index = int(payload.get("person_index", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid person_index"}), 400

    if person_index < 0 or person_index >= len(rig_data):
        return jsonify({"error": "person_index out of range"}), 400

    target_height_cm = payload.get("target_height_cm")
    if target_height_cm is not None:
        try:
            target_height_cm = float(target_height_cm)
        except (TypeError, ValueError):
            return jsonify({"error": "target_height_cm must be numeric"}), 400

    try:
        result = compute_measurements(rig_data[person_index], target_height_cm=target_height_cm)
        result.update({
            "session_id": session_id,
            "person_index": person_index,
        })
        return jsonify(result)
    except MeasurementError as err:
        return jsonify({"error": str(err)}), 422
    except Exception as exc:
        print(f"[Measurements] Failed for session {session_id}: {exc}")
        return jsonify({"error": "Failed to compute measurements"}), 500


# Serve React frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path and Path(app.static_folder, path).exists():
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
