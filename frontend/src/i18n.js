const SIDE_LABELS = {
  en: { left: 'Left Hand', right: 'Right Hand' },
  zh: { left: '左手', right: '右手' }
}

const FINGER_LABELS = {
  thumb: { en: 'Thumb', zh: '拇指' },
  forefinger: { en: 'Index Finger', zh: '食指' },
  middle_finger: { en: 'Middle Finger', zh: '中指' },
  ring_finger: { en: 'Ring Finger', zh: '无名指' },
  pinky_finger: { en: 'Pinky Finger', zh: '小指' }
}

const SEGMENT_LABELS = {
  en: {
    '': '',
    '2': 'Joint 2',
    '3': 'Joint 3',
    '4': 'Joint 4',
    'third_joint': 'Tip',
    'second_joint': 'Second Joint'
  },
  zh: {
    '': '',
    '2': '第2节',
    '3': '第3节',
    '4': '第4节',
    'third_joint': '指尖',
    'second_joint': '第二节'
  }
}

const FINGER_KEYS = Object.keys(FINGER_LABELS)

const formatFingerJointName = (jointName, lang) => {
  const match = jointName.match(/^(left|right)_(.+)$/)
  if (!match) return null

  const [, side, restRaw] = match
  const rest = restRaw
  const fingerKey = FINGER_KEYS.find(key => rest.startsWith(key))
  if (!fingerKey) return null

  let suffix = rest.slice(fingerKey.length)
  if (suffix.startsWith('_')) {
    suffix = suffix.slice(1)
  }

  const sideLabel = SIDE_LABELS[lang]?.[side]
  const fingerLabel = FINGER_LABELS[fingerKey]?.[lang]
  const segmentLabel = SEGMENT_LABELS[lang]?.[suffix] || (suffix ? suffix : '')

  if (!sideLabel || !fingerLabel) return null

  if (segmentLabel) {
    return lang === 'zh'
      ? `${sideLabel}${fingerLabel}${segmentLabel}`
      : `${sideLabel} ${fingerLabel} ${segmentLabel}`
  }

  return lang === 'zh' ? `${sideLabel}${fingerLabel}` : `${sideLabel} ${fingerLabel}`
}

export const translations = {
  en: {
    // Header
    title: "Monocular 3D Body Generator",

    // Upload Panel
    uploadZone: "Click or drag image here",
    uploadFormats: "PNG, JPG, JPEG, WEBP (max 16MB)",
    processing: "Processing...",
    detectingPose: "Detecting 3D body pose...",
    reprocess: "Recompute",
    clearResult: "Clear result",
    cachedSessionHint: "Latest result is cached locally. Refresh won't remove it.",
    restoringSession: "Restoring previous session...",
    processingStatuses: {
      queued: "Queued – waiting for GPU...",
      processing: "Processing image...",
      completed: "Processing finished",
      failed: "Processing failed"
    },

    // Viewer
    uploadToStart: "Upload an image to start",
    dragAndDrop: "Drag and drop or click to upload a photo",
    loadingModel: "Loading 3D model...",
    errorLoading: "Error loading 3D model",

    // Control Panel
    poseControls: "Pose Controls",
    reset: "Reset",
    selectPerson: "Select Person",
    person: "Person",

    // Tabs
    upperBody: "Upper Body",
    lowerBody: "Lower Body",
    fingers: "Fingers",

    // Display Options
    displayOptions: "Display",
    showSkeleton: "Show Skeleton",
    showJoints: "Show Joints",

    // Body Parts
    head: "Head",
    neck: "Neck",
    leftShoulder: "Left Shoulder",
    rightShoulder: "Right Shoulder",
    leftElbow: "Left Elbow",
    rightElbow: "Right Elbow",
    leftWrist: "Left Wrist",
    rightWrist: "Right Wrist",
    pelvis: "Pelvis",
    leftHip: "Left Hip",
    rightHip: "Right Hip",
    leftKnee: "Left Knee",
    rightKnee: "Right Knee",
    leftAnkle: "Left Ankle",
    rightAnkle: "Right Ankle",

    // Fingers
    leftHand: "Left Hand",
    rightHand: "Right Hand",
    thumb: "Thumb",
    index: "Index",
    middle: "Middle",
    ring: "Ring",
    pinky: "Pinky",

    // Axes
    axisX: "X Axis",
    axisY: "Y Axis",
    axisZ: "Z Axis",

    // Measurements
    measurementPanel: {
      title: "Body Measurements",
      subtitle: "Scale the reconstructed mesh to a target height and inspect ISO-style anthropometric values.",
      openButton: "Measurements",
      close: "Close panel",
      exportCsv: "Export CSV",
      targetHeightLabel: "Target height (cm)",
      targetHeightPlaceholder: "e.g. 168",
      action: "Recalculate",
      loading: "Computing measurements...",
      empty: "Measurements will be available after the model is reconstructed.",
      error: "Unable to compute measurements",
      personLabel: "Person",
      actualHeight: "Reconstructed",
      scaledHeight: "Scaled",
      scaleFactor: "Scale factor",
      updatedJustNow: "Just updated",
      retry: "Retry",
      invalidInput: "Enter a valid positive height in centimeters."
    },
    measurementGroups: {
      vertical: "Vertical heights",
      girths: "Circumferences",
      widths: "Widths & lengths",
      special: "Special metrics",
      angle: "Angles"
    },
    measurementUnits: {
      cm: "cm",
      deg: "°"
    },
    measurementLabels: {
      body_height: "Body Height",
      eye_height: "Eye Height",
      cervicale_height: "Cervicale Height",
      waist_height: "Waist Height",
      hip_height: "Hip Height",
      inside_leg_height: "Inside Leg Height",
      knee_height: "Knee Height",
      head_girth: "Head Girth",
      neck_girth: "Neck Girth",
      bust_girth: "Bust / Chest Girth",
      underbust_girth: "Underbust Girth",
      waist_girth: "Waist Girth",
      hip_girth: "Hip Girth",
      thigh_girth: "Thigh Girth",
      knee_girth: "Knee Girth",
      calf_girth: "Calf Girth",
      ankle_girth: "Ankle Girth",
      upper_arm_girth: "Upper Arm Girth",
      wrist_girth: "Wrist Girth",
      shoulder_width: "Shoulder Width (C7 arc)",
      back_width: "Back Width",
      chest_width: "Chest Width",
      arm_length: "Arm / Sleeve Length",
      total_crotch_length: "Total Crotch Length",
      shoulder_slope: "Shoulder Slope"
    },
    measurementDescriptions: {
      body_height: "Vertex (head top) to ground – primary stature.",
      eye_height: "Inner canthus reference height for virtual try-on sight lines.",
      cervicale_height: "C7 spinal process to ground – used for long coats and dresses.",
      waist_height: "Narrowest torso cross-section between iliac crest and ribs.",
      hip_height: "Fullest hip / seat level to the floor.",
      inside_leg_height: "Crotch point to floor (inseam) – core trouser measurement.",
      knee_height: "Patella center vertical position – locates pant knee break.",
      head_girth: "Maximum circumference above the brow ridge for headwear.",
      neck_girth: "Horizontal girth below the Adam's apple – shirt collar reference.",
      bust_girth: "Circumference through bust points (BP) – primary bodice value.",
      underbust_girth: "Girth at the root of the bust – lingerie / evening wear.",
      waist_girth: "Smallest torso girth – core measurement.",
      hip_girth: "Fullest seat girth – trousers and skirts.",
      thigh_girth: "Girth just below the gluteal fold – controls leg ease.",
      knee_girth: "Circumference across patella center – fitted trousers.",
      calf_girth: "Maximum calf girth – tight pants / boots.",
      ankle_girth: "Smallest girth above the lateral malleolus – hem opening.",
      upper_arm_girth: "Midpoint between axilla and acromion – sleeve fullness.",
      wrist_girth: "Circumference at ulnar styloid – cuff opening.",
      shoulder_width: "ISO arc along the back from left to right acromion via C7.",
      back_width: "Surface distance between posterior axilla points.",
      chest_width: "Surface distance between anterior axilla points.",
      arm_length: "Surface path shoulder → elbow → wrist, arm slightly bent.",
      total_crotch_length: "Front waist center through crotch to back waist center.",
      shoulder_slope: "Angle between side-neck → acromion vector and the horizontal plane."
    }
  },

  zh: {
    // Header
    title: "单目三维人体重建",

    // Upload Panel
    uploadZone: "点击或拖拽图片到此处",
    uploadFormats: "PNG, JPG, JPEG, WEBP (最大16MB)",
    processing: "处理中...",
    detectingPose: "正在检测3D人体姿态...",
    reprocess: "重新计算",
    clearResult: "清除结果",
    cachedSessionHint: "已缓存最近一次结果，刷新也不会丢失。",
    restoringSession: "正在恢复上次的结果...",
    processingStatuses: {
      queued: "排队中，等待GPU资源...",
      processing: "图片处理中...",
      completed: "处理完成",
      failed: "处理失败"
    },

    // Viewer
    uploadToStart: "上传图片开始",
    dragAndDrop: "拖拽或点击上传照片",
    loadingModel: "加载3D模型中...",
    errorLoading: "加载3D模型出错",

    // Control Panel
    poseControls: "姿态控制",
    reset: "重置",
    selectPerson: "选择人物",
    person: "人物",

    // Tabs
    upperBody: "上半身",
    lowerBody: "下半身",
    fingers: "手指",

    // Display Options
    displayOptions: "显示选项",
    showSkeleton: "显示骨骼",
    showJoints: "显示关节点",

    // Body Parts
    head: "头部",
    neck: "颈部",
    leftShoulder: "左肩",
    rightShoulder: "右肩",
    leftElbow: "左肘",
    rightElbow: "右肘",
    leftWrist: "左腕",
    rightWrist: "右腕",
    pelvis: "骨盆",
    leftHip: "左髋",
    rightHip: "右髋",
    leftKnee: "左膝",
    rightKnee: "右膝",
    leftAnkle: "左踝",
    rightAnkle: "右踝",

    // Fingers
    leftHand: "左手",
    rightHand: "右手",
    thumb: "拇指",
    index: "食指",
    middle: "中指",
    ring: "无名指",
    pinky: "小指",

    // Axes
    axisX: "X轴",
    axisY: "Y轴",
    axisZ: "Z轴",

    // Measurements
    measurementPanel: {
      title: "人体测量参数",
      subtitle: "按照指定身高对三维模型做等比例换算，输出 ISO 风格的人体尺寸。",
      openButton: "人体测量",
      close: "关闭面板",
      exportCsv: "导出表格",
      targetHeightLabel: "目标身高（cm）",
      targetHeightPlaceholder: "如 168",
      action: "重新计算",
      loading: "正在计算人体参数...",
      empty: "生成三维模型后即可查看测量结果。",
      error: "测量计算失败",
      personLabel: "人物",
      actualHeight: "重建身高",
      scaledHeight: "等比例身高",
      scaleFactor: "缩放系数",
      updatedJustNow: "刚刚更新",
      retry: "重试",
      invalidInput: "请输入合法的正数身高（厘米）。"
    },
    measurementGroups: {
      vertical: "垂直高度",
      girths: "围度",
      widths: "宽度 / 长度",
      special: "特殊指标",
      angle: "角度"
    },
    measurementUnits: {
      cm: "厘米",
      deg: "°"
    },
    measurementLabels: {
      body_height: "身高",
      eye_height: "眼高",
      cervicale_height: "颈椎点高 (C7)",
      waist_height: "腰围高",
      hip_height: "臀围高",
      inside_leg_height: "会阴高 / 内长",
      knee_height: "膝盖高",
      head_girth: "头围",
      neck_girth: "颈围",
      bust_girth: "胸围 / 乳围",
      underbust_girth: "下胸围",
      waist_girth: "腰围",
      hip_girth: "臀围",
      thigh_girth: "大腿围",
      knee_girth: "膝围",
      calf_girth: "小腿围",
      ankle_girth: "踝围",
      upper_arm_girth: "上臂围",
      wrist_girth: "腕围",
      shoulder_width: "肩宽（过 C7 弧长）",
      back_width: "背宽",
      chest_width: "胸宽",
      arm_length: "臂长 / 袖长",
      total_crotch_length: "全裆长",
      shoulder_slope: "肩斜度"
    },
    measurementDescriptions: {
      body_height: "头顶点 (Vertex) 到地面的垂直距离。",
      eye_height: "内眼角到地面，主要用于虚拟试衣视线参考。",
      cervicale_height: "第七颈椎棘突 C7 到地面，用于长外套 / 长裙定位。",
      waist_height: "腰部最细截面到地面（髋骨上方、肋骨下方）。",
      hip_height: "臀部最丰满截面到地面。",
      inside_leg_height: "会阴点到地面（裤装核心数据 / 内长）。",
      knee_height: "髌骨中心到地面，决定裤子膝盖位置。",
      head_girth: "眉骨上方最大水平围度（帽子尺寸）。",
      neck_girth: "喉结下方的水平围度（衬衫领围）。",
      bust_girth: "经过胸高点 (BP) 的水平围度，上装核心尺寸。",
      underbust_girth: "乳房根部的水平围度（女士内衣 / 礼服）。",
      waist_girth: "躯干最细处的水平围度。",
      hip_girth: "臀部最丰满处的水平围度，裤装 / 裙装核心。",
      thigh_girth: "臀折线下方的大腿水平围度，决定裤腿肥瘦。",
      knee_girth: "膝盖骨中点的水平围度，修身裤核心。",
      calf_girth: "小腿肚最粗处的水平围度。",
      ankle_girth: "外踝骨上方的最小围度（裤脚口）。",
      upper_arm_girth: "腋下与肩峰连线中点的围度（袖肥）。",
      wrist_girth: "尺骨茎突处的围度（袖口）。",
      shoulder_width: "按照 ISO，左 / 右肩峰点经颈椎点 C7 的后背弧长。",
      back_width: "两腋后点之间的水平表面距离。",
      chest_width: "两腋前点之间的水平表面距离。",
      arm_length: "肩峰点 → 肘点 → 腕点的表面距离，手臂微弯。",
      total_crotch_length: "前腰中心穿过裆底连接后腰中心的表面距离。",
      shoulder_slope: "颈侧点到肩峰点向量与水平面的夹角。"
    }
  }
}

export const getJointDisplayName = (jointName, lang = 'en') => {
  const nameMap = {
    en: {
      neck: "Neck",
      head: "Head",
      left_shoulder: "Left Shoulder",
      right_shoulder: "Right Shoulder",
      left_elbow: "Left Elbow",
      right_elbow: "Right Elbow",
      left_wrist: "Left Wrist",
      right_wrist: "Right Wrist",
      pelvis: "Pelvis",
      left_hip: "Left Hip",
      right_hip: "Right Hip",
      left_knee: "Left Knee",
      right_knee: "Right Knee",
      left_ankle: "Left Ankle",
      right_ankle: "Right Ankle",
      // Fingers
      left_thumb: "Left Thumb",
      right_thumb: "Right Thumb",
      left_forefinger: "Left Index",
      right_forefinger: "Right Index",
      left_middle_finger: "Left Middle",
      right_middle_finger: "Right Middle",
      left_ring_finger: "Left Ring",
      right_ring_finger: "Right Ring",
      left_pinky_finger: "Left Pinky",
      right_pinky_finger: "Right Pinky",
    },
    zh: {
      neck: "颈部",
      head: "头部",
      left_shoulder: "左肩",
      right_shoulder: "右肩",
      left_elbow: "左肘",
      right_elbow: "右肘",
      left_wrist: "左腕",
      right_wrist: "右腕",
      pelvis: "骨盆",
      left_hip: "左髋",
      right_hip: "右髋",
      left_knee: "左膝",
      right_knee: "右膝",
      left_ankle: "左踝",
      right_ankle: "右踝",
      // Fingers
      left_thumb: "左手拇指",
      right_thumb: "右手拇指",
      left_forefinger: "左手食指",
      right_forefinger: "右手食指",
      left_middle_finger: "左手中指",
      right_middle_finger: "右手中指",
      left_ring_finger: "左手无名指",
      right_ring_finger: "右手无名指",
      left_pinky_finger: "左手小指",
      right_pinky_finger: "右手小指",
    }
  }

  if (nameMap[lang][jointName]) {
    return nameMap[lang][jointName]
  }

  const fingerName = formatFingerJointName(jointName, lang)
  if (fingerName) {
    return fingerName
  }

  return jointName
}
