import math
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np


class MeasurementError(RuntimeError):
    """Raised when a measurement cannot be derived from the provided rig."""


@dataclass(frozen=True)
class MeasurementMeta:
    key: str
    unit: str
    scales_with_height: bool
    category: str  # e.g. "vertical", "girth", "width", "special", "angle"


MEASUREMENT_META: Dict[str, MeasurementMeta] = {
    "body_height": MeasurementMeta("body_height", "cm", True, "vertical"),
    "eye_height": MeasurementMeta("eye_height", "cm", True, "vertical"),
    "cervicale_height": MeasurementMeta("cervicale_height", "cm", True, "vertical"),
    "waist_height": MeasurementMeta("waist_height", "cm", True, "vertical"),
    "hip_height": MeasurementMeta("hip_height", "cm", True, "vertical"),
    "inside_leg_height": MeasurementMeta("inside_leg_height", "cm", True, "vertical"),
    "knee_height": MeasurementMeta("knee_height", "cm", True, "vertical"),
    "head_girth": MeasurementMeta("head_girth", "cm", True, "girth"),
    "neck_girth": MeasurementMeta("neck_girth", "cm", True, "girth"),
    "bust_girth": MeasurementMeta("bust_girth", "cm", True, "girth"),
    "underbust_girth": MeasurementMeta("underbust_girth", "cm", True, "girth"),
    "waist_girth": MeasurementMeta("waist_girth", "cm", True, "girth"),
    "hip_girth": MeasurementMeta("hip_girth", "cm", True, "girth"),
    "thigh_girth": MeasurementMeta("thigh_girth", "cm", True, "girth"),
    "knee_girth": MeasurementMeta("knee_girth", "cm", True, "girth"),
    "calf_girth": MeasurementMeta("calf_girth", "cm", True, "girth"),
    "ankle_girth": MeasurementMeta("ankle_girth", "cm", True, "girth"),
    "upper_arm_girth": MeasurementMeta("upper_arm_girth", "cm", True, "girth"),
    "wrist_girth": MeasurementMeta("wrist_girth", "cm", True, "girth"),
    "shoulder_width": MeasurementMeta("shoulder_width", "cm", True, "width"),
    "back_width": MeasurementMeta("back_width", "cm", True, "width"),
    "chest_width": MeasurementMeta("chest_width", "cm", True, "width"),
    "arm_length": MeasurementMeta("arm_length", "cm", True, "special"),
    "total_crotch_length": MeasurementMeta("total_crotch_length", "cm", True, "special"),
    "shoulder_slope": MeasurementMeta("shoulder_slope", "deg", False, "angle"),
}


def _vector_map(names: Iterable[str], positions: np.ndarray) -> Dict[str, np.ndarray]:
    mapping: Dict[str, np.ndarray] = {}
    for idx, name in enumerate(names):
        if idx >= positions.shape[0]:
            break
        mapping[name] = positions[idx]
    return mapping


def _keypoint_map(keypoints: Iterable[Dict[str, Iterable[float]]]) -> Dict[str, np.ndarray]:
    mapping: Dict[str, np.ndarray] = {}
    for entry in keypoints:
        name = entry.get("name")
        pos = entry.get("position")
        if name is None or pos is None:
            continue
        arr = np.asarray(pos, dtype=np.float32)
        if arr.shape == (3,):
            mapping[name] = arr
    return mapping


def _average_points(points: Iterable[Optional[np.ndarray]]) -> Optional[np.ndarray]:
    valid = [p for p in points if p is not None]
    if not valid:
        return None
    stacked = np.stack(valid, axis=0)
    return stacked.mean(axis=0)


def _average_values(values: Iterable[Optional[float]]) -> Optional[float]:
    valid: List[float] = []
    for value in values:
        if value is None:
            continue
        try:
            scalar = float(value)
        except (TypeError, ValueError):
            continue
        if math.isnan(scalar):
            continue
        valid.append(scalar)
    if not valid:
        return None
    return sum(valid) / len(valid)


def _coalesce_points(*points: Optional[np.ndarray]) -> Optional[np.ndarray]:
    for point in points:
        if point is not None:
            return point
    return None


def _convex_hull(points: np.ndarray) -> Optional[np.ndarray]:
    """2D convex hull using Andrew's monotone chain algorithm."""
    if points.shape[0] < 3:
        return None

    pts = np.unique(points, axis=0)
    if pts.shape[0] < 3:
        return None

    pts = pts[np.lexsort((pts[:, 1], pts[:, 0]))]

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: List[np.ndarray] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper: List[np.ndarray] = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    hull = np.array(lower[:-1] + upper[:-1], dtype=np.float32)
    if hull.shape[0] < 3:
        return None
    return hull


def _perimeter_from_points(points: np.ndarray) -> Optional[float]:
    hull = _convex_hull(points)
    if hull is None:
        return None
    shifted = np.roll(hull, -1, axis=0)
    return float(np.linalg.norm(hull - shifted, axis=1).sum())


def _ellipse_perimeter(a: float, b: float) -> float:
    if a <= 0 or b <= 0:
        return 0.0
    # Ramanujan approximation
    h = ((a - b) ** 2) / ((a + b) ** 2)
    return math.pi * (a + b) * (1 + (3 * h) / (10 + math.sqrt(4 - 3 * h)))


def _section_points(vertices: np.ndarray, target_y: float, thickness: float) -> np.ndarray:
    mask = np.abs(vertices[:, 1] - target_y) <= thickness
    return vertices[mask]


def _section_circumference(vertices: np.ndarray, target_y: float, base_thickness: float = 0.015) -> Optional[float]:
    """Approximate circumference of a horizontal body slice."""
    thickness = base_thickness
    for _ in range(3):
        slice_vertices = _section_points(vertices, target_y, thickness)
        if slice_vertices.shape[0] >= 12:
            # Use XZ projection
            girth = _perimeter_from_points(slice_vertices[:, [0, 2]])
            if girth:
                return girth
        thickness *= 1.5

    # Fallback to ellipse approximation with bounding box
    slice_vertices = _section_points(vertices, target_y, thickness)
    if slice_vertices.shape[0] < 4:
        return None
    width = float(slice_vertices[:, 0].max() - slice_vertices[:, 0].min())
    depth = float(slice_vertices[:, 2].max() - slice_vertices[:, 2].min())
    a = max(width, depth) / 2
    b = min(width, depth) / 2
    if a <= 0 or b <= 0:
        return None
    return _ellipse_perimeter(a, b)


def _scan_min_circumference(vertices: np.ndarray, start_y: float, end_y: float, steps: int = 25) -> Optional[Tuple[float, float]]:
    if steps <= 0:
        return None
    y0, y1 = (start_y, end_y) if start_y <= end_y else (end_y, start_y)
    ys = np.linspace(y0, y1, steps)
    best: Optional[Tuple[float, float]] = None
    for y in ys:
        girth = _section_circumference(vertices, float(y))
        if girth is None:
            continue
        if best is None or girth < best[1]:
            best = (float(y), float(girth))
    return best


def _limb_girth(
    vertices: np.ndarray,
    center_point: Optional[np.ndarray],
    target_y: float,
    radius: float,
    thickness: float = 0.02,
) -> Optional[float]:
    if center_point is None:
        return None
    slice_vertices = _section_points(vertices, target_y, thickness)
    if slice_vertices.shape[0] < 6:
        return None
    horizontal = slice_vertices[:, [0, 2]]
    center = center_point[[0, 2]]
    radial_mask = np.linalg.norm(horizontal - center, axis=1) <= radius
    selected = slice_vertices[radial_mask][:, [0, 2]]
    if selected.shape[0] < 4:
        return None
    return _perimeter_from_points(selected)


def _waist_front_back(vertices: np.ndarray, waist_y: float) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
    waist_slice = _section_points(vertices, waist_y, 0.02)
    if waist_slice.shape[0] == 0:
        return None, None
    front_idx = int(np.argmax(waist_slice[:, 2]))
    back_idx = int(np.argmin(waist_slice[:, 2]))
    return waist_slice[front_idx], waist_slice[back_idx]


def _axilla_points(vertices: np.ndarray, level_y: float, center_x: float, side: str) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
    candidates = _section_points(vertices, level_y, 0.025)
    if candidates.shape[0] == 0:
        return None, None
    if side == "left":
        side_mask = candidates[:, 0] >= center_x
    else:
        side_mask = candidates[:, 0] <= center_x
    side_points = candidates[side_mask]
    if side_points.shape[0] == 0:
        return None, None
    front = side_points[int(np.argmax(side_points[:, 2]))]
    back = side_points[int(np.argmin(side_points[:, 2]))]
    return front, back


def _crotch_point(vertices: np.ndarray, hip_center: Optional[np.ndarray], knee_level_y: Optional[float], ground_y: float) -> Optional[np.ndarray]:
    if hip_center is None:
        return None
    y_min = ground_y + 0.05
    y_max = hip_center[1]
    lower = knee_level_y if knee_level_y is not None else y_min
    mask = (
        (vertices[:, 1] < y_max)
        & (vertices[:, 1] > lower - 0.05)
        & (np.abs(vertices[:, 0] - hip_center[0]) < 0.12)
        & (np.abs(vertices[:, 2] - hip_center[2]) < 0.2)
    )
    candidates = vertices[mask]
    if candidates.shape[0] == 0:
        return None
    return candidates[int(np.argmin(candidates[:, 1]))]


def _landmark_to_list(point: Optional[np.ndarray]) -> Optional[List[float]]:
    if point is None:
        return None
    return point.astype(float).round(6).tolist()


def compute_measurements(person_rig: Dict, target_height_cm: Optional[float] = None) -> Dict[str, object]:
    """Compute anthropometric measurements for a reconstructed person."""
    mesh = person_rig.get("mesh") or {}
    skeleton = person_rig.get("skeleton") or {}

    vertices = np.asarray(mesh.get("vertices"), dtype=np.float32)
    joint_positions = np.asarray(skeleton.get("joint_positions"), dtype=np.float32)
    joint_names = skeleton.get("joint_names") or []
    keypoints = person_rig.get("keypoints") or []

    if vertices.size == 0:
        raise MeasurementError("Mesh vertices are missing")

    ground_y = float(vertices[:, 1].min())
    head_idx = int(np.argmax(vertices[:, 1]))
    head_vertex = vertices[head_idx]
    actual_height_m = float(head_vertex[1] - ground_y)
    if actual_height_m <= 0:
        raise MeasurementError("Invalid reconstructed height")

    actual_height_cm = actual_height_m * 100.0
    if target_height_cm is None:
        target_height_cm = actual_height_cm

    target_height_cm = float(target_height_cm)
    if target_height_cm <= 0:
        raise MeasurementError("Target height must be positive")

    scale_factor = float(target_height_cm) / actual_height_cm

    joint_map = _vector_map(joint_names, joint_positions) if joint_positions.size else {}
    keypoint_map = _keypoint_map(keypoints)

    neck_point = _coalesce_points(keypoint_map.get("neck"), joint_map.get("neck"))
    left_shoulder = _coalesce_points(keypoint_map.get("left_shoulder"), joint_map.get("left_shoulder"))
    right_shoulder = _coalesce_points(keypoint_map.get("right_shoulder"), joint_map.get("right_shoulder"))
    left_acromion = _coalesce_points(keypoint_map.get("left_acromion"), left_shoulder)
    right_acromion = _coalesce_points(keypoint_map.get("right_acromion"), right_shoulder)
    left_hip = _coalesce_points(keypoint_map.get("left_hip"), joint_map.get("left_hip"))
    right_hip = _coalesce_points(keypoint_map.get("right_hip"), joint_map.get("right_hip"))
    left_knee = _coalesce_points(keypoint_map.get("left_knee"), joint_map.get("left_knee"))
    right_knee = _coalesce_points(keypoint_map.get("right_knee"), joint_map.get("right_knee"))
    left_ankle = _coalesce_points(keypoint_map.get("left_ankle"), joint_map.get("left_ankle"))
    right_ankle = _coalesce_points(keypoint_map.get("right_ankle"), joint_map.get("right_ankle"))
    left_elbow = _coalesce_points(keypoint_map.get("left_elbow"), joint_map.get("left_elbow"))
    right_elbow = _coalesce_points(keypoint_map.get("right_elbow"), joint_map.get("right_elbow"))
    left_wrist = _coalesce_points(keypoint_map.get("left_wrist"), joint_map.get("left_wrist"))
    right_wrist = _coalesce_points(keypoint_map.get("right_wrist"), joint_map.get("right_wrist"))
    eye_point = _average_points([
        keypoint_map.get("left_eye"),
        keypoint_map.get("right_eye"),
        keypoint_map.get("nose"),
    ])

    hip_center = _average_points([left_hip, right_hip])
    shoulder_center = _average_points([left_shoulder, right_shoulder])
    acromion_center = _average_points([left_acromion, right_acromion])
    torso_upper_y = float(acromion_center[1]) if acromion_center is not None else float(shoulder_center[1]) if shoulder_center is not None else float(head_vertex[1] * 0.85)
    hip_level_y = float(hip_center[1]) if hip_center is not None else float(ground_y + actual_height_m * 0.45)
    torso_span = max(torso_upper_y - hip_level_y, actual_height_m * 0.1)
    bust_level_y = torso_upper_y - 0.22 * torso_span
    underbust_level_y = bust_level_y - 0.05 * torso_span

    knee_center = _average_points([left_knee, right_knee])
    if knee_center is not None:
        knee_level_y = float(knee_center[1])
    else:
        knee_level_y = ground_y + actual_height_m * 0.26

    ankle_center = _average_points([left_ankle, right_ankle])
    if ankle_center is not None:
        ankle_level_y = float(ankle_center[1])
    else:
        ankle_level_y = ground_y + actual_height_m * 0.05

    waist_scan = _scan_min_circumference(vertices, hip_level_y + 0.03, torso_upper_y - 0.05, 30)
    waist_level_y = float(waist_scan[0]) if waist_scan else float(hip_level_y + 0.15 * torso_span)

    thigh_level_y = hip_level_y - 0.25 * (hip_level_y - knee_level_y)
    calf_level_y = knee_level_y - 0.45 * (knee_level_y - ankle_level_y)

    crotch_point = _crotch_point(vertices, hip_center, knee_level_y, ground_y)
    inside_leg = (crotch_point[1] - ground_y) if crotch_point is not None else hip_level_y - ground_y

    torso_center_x = hip_center[0] if hip_center is not None else 0.0
    axilla_level_y = hip_level_y + 0.7 * (torso_upper_y - hip_level_y)
    left_axilla_front, left_axilla_back = _axilla_points(vertices, axilla_level_y, torso_center_x, "left")
    right_axilla_front, right_axilla_back = _axilla_points(vertices, axilla_level_y, torso_center_x, "right")

    waist_front, waist_back = _waist_front_back(vertices, waist_level_y)

    head_length = float(head_vertex[1] - neck_point[1]) if neck_point is not None else actual_height_m * 0.13
    head_girth_level = float(head_vertex[1] - 0.12 * head_length)
    neck_level_y = float(neck_point[1] - 0.01) if neck_point is not None else torso_upper_y - 0.05

    thigh_girth_left = _limb_girth(vertices, left_knee, thigh_level_y, radius=0.22)
    thigh_girth_right = _limb_girth(vertices, right_knee, thigh_level_y, radius=0.22)
    knee_girth_left = _limb_girth(vertices, left_knee, knee_level_y, radius=0.18, thickness=0.015)
    knee_girth_right = _limb_girth(vertices, right_knee, knee_level_y, radius=0.18, thickness=0.015)
    calf_center_left = _average_points([left_knee, left_ankle])
    calf_center_right = _average_points([right_knee, right_ankle])
    calf_girth_left = _limb_girth(vertices, calf_center_left, calf_level_y, radius=0.16)
    calf_girth_right = _limb_girth(vertices, calf_center_right, calf_level_y, radius=0.16)
    ankle_girth_left = _limb_girth(vertices, left_ankle, ankle_level_y, radius=0.12, thickness=0.012)
    ankle_girth_right = _limb_girth(vertices, right_ankle, ankle_level_y, radius=0.12, thickness=0.012)

    upper_arm_center_left = _average_points([left_shoulder, left_elbow])
    upper_arm_center_right = _average_points([right_shoulder, right_elbow])
    shoulder_ref = left_shoulder if left_shoulder is not None else right_shoulder if right_shoulder is not None else acromion_center
    elbow_ref = left_elbow if left_elbow is not None else right_elbow
    if shoulder_ref is not None and elbow_ref is not None:
        upper_arm_level_y = float(shoulder_ref[1] - 0.4 * (shoulder_ref[1] - elbow_ref[1]))
    else:
        upper_arm_level_y = torso_upper_y - 0.2 * torso_span
    upper_arm_girth_left = _limb_girth(vertices, upper_arm_center_left, upper_arm_level_y, radius=0.13)
    upper_arm_girth_right = _limb_girth(vertices, upper_arm_center_right, upper_arm_level_y, radius=0.13)

    wrist_center = _average_points([left_wrist, right_wrist])
    if wrist_center is not None:
        wrist_level_y = float(wrist_center[1])
    else:
        wrist_level_y = upper_arm_level_y - 0.25
    wrist_girth_left = _limb_girth(vertices, left_wrist, wrist_level_y, radius=0.08, thickness=0.01)
    wrist_girth_right = _limb_girth(vertices, right_wrist, wrist_level_y, radius=0.08, thickness=0.01)

    arm_length = None
    if left_shoulder is not None and left_elbow is not None and left_wrist is not None:
        arm_length = float(np.linalg.norm(left_shoulder - left_elbow) + np.linalg.norm(left_elbow - left_wrist))
    elif right_shoulder is not None and right_elbow is not None and right_wrist is not None:
        arm_length = float(np.linalg.norm(right_shoulder - right_elbow) + np.linalg.norm(right_elbow - right_wrist))

    shoulder_width = None
    if left_acromion is not None and right_acromion is not None:
        if neck_point is not None:
            shoulder_width = float(
                np.linalg.norm(left_acromion - neck_point) + np.linalg.norm(neck_point - right_acromion)
            )
        else:
            shoulder_width = float(np.linalg.norm(left_acromion - right_acromion))

    back_width = None
    if left_axilla_back is not None and right_axilla_back is not None:
        back_width = float(np.linalg.norm(left_axilla_back[[0, 2]] - right_axilla_back[[0, 2]]))
    elif left_shoulder is not None and right_shoulder is not None:
        back_width = float(np.linalg.norm(left_shoulder[[0]] - right_shoulder[[0]]))

    chest_width = None
    if left_axilla_front is not None and right_axilla_front is not None:
        chest_width = float(np.linalg.norm(left_axilla_front[[0, 2]] - right_axilla_front[[0, 2]]))

    total_crotch_length = None
    if waist_front is not None and waist_back is not None and crotch_point is not None:
        total_crotch_length = float(
            np.linalg.norm(waist_front - crotch_point) + np.linalg.norm(crotch_point - waist_back)
        )

    shoulder_slope = None
    if neck_point is not None and left_acromion is not None:
        vec = left_acromion - neck_point
        horizontal = vec.copy()
        horizontal[1] = 0
        lateral = float(np.linalg.norm(horizontal))
        if lateral > 1e-6:
            shoulder_slope = math.degrees(math.atan2(abs(vec[1]), lateral))

    raw_measurements: Dict[str, Optional[float]] = {
        "body_height": actual_height_m,
        "eye_height": (eye_point[1] - ground_y) if eye_point is not None else None,
        "cervicale_height": (neck_point[1] - ground_y) if neck_point is not None else None,
        "waist_height": waist_level_y - ground_y,
        "hip_height": hip_level_y - ground_y,
        "inside_leg_height": inside_leg,
        "knee_height": knee_level_y - ground_y,
        "head_girth": _section_circumference(vertices, head_girth_level, 0.01),
        "neck_girth": _section_circumference(vertices, neck_level_y, 0.01),
        "bust_girth": _section_circumference(vertices, bust_level_y, 0.02),
        "underbust_girth": _section_circumference(vertices, underbust_level_y, 0.02),
        "waist_girth": waist_scan[1] if waist_scan else _section_circumference(vertices, waist_level_y, 0.02),
        "hip_girth": _section_circumference(vertices, hip_level_y, 0.025),
        "thigh_girth": _average_values([thigh_girth_left, thigh_girth_right]),
        "knee_girth": _average_values([knee_girth_left, knee_girth_right]),
        "calf_girth": _average_values([calf_girth_left, calf_girth_right]),
        "ankle_girth": _average_values([ankle_girth_left, ankle_girth_right]),
        "upper_arm_girth": _average_values([upper_arm_girth_left, upper_arm_girth_right]),
        "wrist_girth": _average_values([wrist_girth_left, wrist_girth_right]),
        "shoulder_width": shoulder_width,
        "back_width": back_width,
        "chest_width": chest_width,
        "arm_length": arm_length,
        "total_crotch_length": total_crotch_length,
        "shoulder_slope": shoulder_slope,
    }

    scaled_measurements: Dict[str, float] = {}
    for key, value in raw_measurements.items():
        if value is None:
            continue
        meta = MEASUREMENT_META.get(key)
        if meta is None:
            continue
        if meta.unit == "deg" or not meta.scales_with_height:
            scaled_measurements[key] = round(float(value), 2)
        else:
            scaled_measurements[key] = round(float(value) * scale_factor * 100.0, 2)

    landmarks = {
        "head_top": _landmark_to_list(head_vertex),
        "cervicale": _landmark_to_list(neck_point),
        "neck_side_left": _landmark_to_list(_average_points([neck_point, left_acromion])),
        "neck_side_right": _landmark_to_list(_average_points([neck_point, right_acromion])),
        "acromion_left": _landmark_to_list(left_acromion),
        "acromion_right": _landmark_to_list(right_acromion),
        "axilla_left_front": _landmark_to_list(left_axilla_front),
        "axilla_left_back": _landmark_to_list(left_axilla_back),
        "axilla_right_front": _landmark_to_list(right_axilla_front),
        "axilla_right_back": _landmark_to_list(right_axilla_back),
        "bust_point_left": _landmark_to_list(_average_points([left_axilla_front, waist_front])),
        "bust_point_right": _landmark_to_list(_average_points([right_axilla_front, waist_front])),
        "waist_level": round(float(waist_level_y), 5),
        "hip_level": round(float(hip_level_y), 5),
        "crotch": _landmark_to_list(crotch_point),
        "lateral_malleolus_left": _landmark_to_list(left_ankle),
        "lateral_malleolus_right": _landmark_to_list(right_ankle),
    }

    schema = {
        key: {
            "unit": meta.unit,
            "category": meta.category,
            "scales_with_height": meta.scales_with_height,
        }
        for key, meta in MEASUREMENT_META.items()
    }

    return {
        "actual_height_cm": round(actual_height_cm, 2),
        "target_height_cm": round(target_height_cm, 2),
        "scale_factor": round(scale_factor, 4),
        "measurements": scaled_measurements,
        "landmarks": landmarks,
        "metadata": {
            "waist_level_y": round(float(waist_level_y), 5),
            "hip_level_y": round(float(hip_level_y), 5),
            "bust_level_y": round(float(bust_level_y), 5),
        },
        "schema": schema,
    }

