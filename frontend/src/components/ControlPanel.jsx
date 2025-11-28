import { Box, Heading, Text, Button, Flex, ScrollArea, Tabs, Switch, Select } from '@radix-ui/themes'
import { RotateCcw, User, ChevronDown, ChevronUp } from 'lucide-react'
import JointControl from './JointControl'
import { translations, getJointDisplayName } from '../i18n'
import './ControlPanel.css'
import { useState } from 'react'

const BODY_PARTS = {
  upperBody: ['head', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
  lowerBody: ['pelvis', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
}

// Finger joint patterns - these might have different indices
const FINGER_PATTERNS = {
  leftHand: [
    'left_thumb',
    'left_forefinger',
    'left_middle_finger',
    'left_ring_finger',
    'left_pinky_finger'
  ],
  rightHand: [
    'right_thumb',
    'right_forefinger',
    'right_middle_finger',
    'right_ring_finger',
    'right_pinky_finger'
  ]
}

export default function ControlPanel({
  rigData,
  selectedPerson,
  onPersonSelect,
  jointRotations,
  onJointRotationChange,
  onResetPose,
  showJoints,
  onToggleJoints,
  language
}) {
  const [showDebug, setShowDebug] = useState(false)

  if (!rigData) return null

  const t = translations[language]
  const currentRig = rigData.rig_data[selectedPerson]
  const animationTargets = currentRig?.animation_targets || {}

  console.log('[Control] All animation_targets:', animationTargets)

  // Find finger joints that exist in animation_targets
  const availableFingerJoints = {}

  // Check for any finger-related joints
  const allJointNames = Object.keys(animationTargets)
  console.log('[Control] All joint names:', allJointNames)

  const fingerKeywords = ['thumb', 'finger', 'forefinger', 'middle_finger', 'ring_finger', 'pinky']
  const fingerJoints = allJointNames.filter(name =>
    fingerKeywords.some(keyword => name.toLowerCase().includes(keyword))
  )

  console.log('[Control] Found finger joints:', fingerJoints)

  // Group by left/right hand
  availableFingerJoints.leftHand = fingerJoints.filter(name => name.includes('left'))
  availableFingerJoints.rightHand = fingerJoints.filter(name => name.includes('right'))

  const hasFingers = availableFingerJoints.leftHand.length > 0 || availableFingerJoints.rightHand.length > 0

  console.log('[Control] Available finger joints:', availableFingerJoints)
  console.log('[Control] Has fingers:', hasFingers)

  return (
    <Box className="control-panel">
      <ScrollArea style={{ height: 'calc(100vh - 300px)' }}>
        <Box p="4">
          <Flex justify="between" align="center" mb="3">
            <Heading size="4">{t.poseControls}</Heading>
            <Button size="1" variant="soft" onClick={onResetPose}>
              <RotateCcw size={14} />
              {t.reset}
            </Button>
          </Flex>

          {/* Display Options */}
          <Box mb="4" p="3" style={{ background: 'var(--gray-3)', borderRadius: 'var(--radius-2)' }}>
            <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
              {t.displayOptions}
            </Text>
            <Flex direction="column" gap="2">
              <Flex justify="between" align="center">
                <Text size="2">{t.showJoints}</Text>
                <Switch checked={showJoints} onCheckedChange={onToggleJoints} />
              </Flex>
            </Flex>
          </Box>

          {rigData.num_persons > 1 && (
            <Box mb="4">
              <Flex justify="between" align="center" mb="2">
                <Text size="2" weight="medium">
                  {t.selectPerson}
                </Text>
                <Text size="1" color="gray">
                  {t.person} {selectedPerson + 1}/{rigData.num_persons}
                </Text>
              </Flex>

              {rigData.num_persons >= 6 && (
                <Box mb="2">
                  <Select.Root
                    value={String(selectedPerson)}
                    onValueChange={(value) => onPersonSelect(Number(value))}
                  >
                    <Select.Trigger variant="soft" size="2" style={{ width: '100%' }}>
                      <User size={14} />
                      {t.person} {selectedPerson + 1}
                    </Select.Trigger>
                    <Select.Content>
                      {rigData.rig_data.map((_, idx) => (
                        <Select.Item key={idx} value={String(idx)}>
                          {t.person} {idx + 1}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>
              )}

              <Box className="person-selector-row-wrapper">
                <Flex gap="2" wrap="wrap" className="person-selector-row">
                  {rigData.rig_data.map((_, idx) => (
                    <Button
                      key={idx}
                      size="2"
                      variant={selectedPerson === idx ? 'solid' : 'soft'}
                      onClick={() => onPersonSelect(idx)}
                      className="person-selector-chip"
                    >
                      <User size={14} />
                      {t.person} {idx + 1}
                    </Button>
                  ))}
                </Flex>
              </Box>
            </Box>
          )}

          <Tabs.Root defaultValue="upper">
            <Tabs.List>
              <Tabs.Trigger value="upper">{t.upperBody}</Tabs.Trigger>
              <Tabs.Trigger value="lower">{t.lowerBody}</Tabs.Trigger>
              {hasFingers && <Tabs.Trigger value="fingers">{t.fingers}</Tabs.Trigger>}
            </Tabs.List>

            <Box pt="3">
              {/* Upper Body */}
              <Tabs.Content value="upper">
                <Box className="joint-controls-grid">
                  {BODY_PARTS.upperBody.map(jointName => {
                    if (!animationTargets[jointName]) {
                      console.log(`[Control] Joint not found: ${jointName}`)
                      return null
                    }

                    return (
                      <JointControl
                        key={jointName}
                        jointName={jointName}
                        displayName={getJointDisplayName(jointName, language)}
                        rotation={jointRotations[jointName] || { x: 0, y: 0, z: 0 }}
                        onChange={onJointRotationChange}
                        language={language}
                      />
                    )
                  })}
                </Box>
              </Tabs.Content>

              {/* Lower Body */}
              <Tabs.Content value="lower">
                <Box className="joint-controls-grid">
                  {BODY_PARTS.lowerBody.map(jointName => {
                    if (!animationTargets[jointName]) return null

                    return (
                      <JointControl
                        key={jointName}
                        jointName={jointName}
                        displayName={getJointDisplayName(jointName, language)}
                        rotation={jointRotations[jointName] || { x: 0, y: 0, z: 0 }}
                        onChange={onJointRotationChange}
                        language={language}
                      />
                    )
                  })}
                </Box>
              </Tabs.Content>

              {/* Fingers */}
              {hasFingers && (
                <Tabs.Content value="fingers">
                  <Box className="joint-controls-grid">
                    {/* Left Hand */}
                    {availableFingerJoints.leftHand.length > 0 && (
                      <>
                        <Text size="3" weight="bold" mb="2" style={{ display: 'block' }}>
                          {t.leftHand} ({availableFingerJoints.leftHand.length})
                        </Text>
                        {availableFingerJoints.leftHand.map(jointName => (
                          <JointControl
                            key={jointName}
                            jointName={jointName}
                            displayName={getJointDisplayName(jointName, language)}
                            rotation={jointRotations[jointName] || { x: 0, y: 0, z: 0 }}
                            onChange={onJointRotationChange}
                            language={language}
                          />
                        ))}
                      </>
                    )}

                    {/* Right Hand */}
                    {availableFingerJoints.rightHand.length > 0 && (
                      <>
                        <Text size="3" weight="bold" mb="2" mt="3" style={{ display: 'block' }}>
                          {t.rightHand} ({availableFingerJoints.rightHand.length})
                        </Text>
                        {availableFingerJoints.rightHand.map(jointName => (
                          <JointControl
                            key={jointName}
                            jointName={jointName}
                            displayName={getJointDisplayName(jointName, language)}
                            rotation={jointRotations[jointName] || { x: 0, y: 0, z: 0 }}
                            onChange={onJointRotationChange}
                            language={language}
                          />
                        ))}
                      </>
                    )}
                  </Box>
                </Tabs.Content>
              )}
            </Box>
          </Tabs.Root>

          {/* Debug: Show all available joints - Collapsible */}
          {process.env.NODE_ENV === 'development' && (
            <Box mt="4">
              <Button
                size="1"
                variant="ghost"
                onClick={() => setShowDebug(!showDebug)}
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <Text size="1" weight="medium">
                  Debug Info ({Object.keys(animationTargets).length} joints)
                </Text>
                {showDebug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
              {showDebug && (
                <Box mt="2" p="3" style={{ background: 'var(--gray-3)', borderRadius: 'var(--radius-2)' }}>
                  <Text size="1" color="gray" weight="bold" mb="2" style={{ display: 'block' }}>
                    Available joints:
                  </Text>
                  <Text size="1" color="gray" style={{ fontFamily: 'monospace', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto', display: 'block' }}>
                    {Object.keys(animationTargets).join(', ')}
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </ScrollArea>
    </Box>
  )
}
