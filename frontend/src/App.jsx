 import { useState, useCallback, useEffect, useRef, createContext } from 'react'
import { Flex, Box, Button } from '@radix-ui/themes'
import UploadPanel from './components/UploadPanel'
import ViewerPanel from './components/ViewerPanel'
import ControlPanel from './components/ControlPanel'
import MeasurementOverlay from './components/MeasurementOverlay'
import { translations } from './i18n'
import './App.css'

export const LanguageContext = createContext('en')

const SESSION_CACHE_KEY = 'sam3d-body-session-v1'

const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const dataUrlToFile = (dataUrl, filename, fallbackType = 'image/png') => {
  const arr = dataUrl.split(',')
  const mimeMatch = arr[0]?.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : fallbackType
  const bstr = atob(arr[1])
  const len = bstr.length
  const u8arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new File([u8arr], filename, { type: mime })
}

function App() {
  const [rigData, setRigData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedPerson, setSelectedPerson] = useState(0)
  // Store joint rotations per person: { personIndex: { jointName: { x, y, z } } }
  const [jointRotationsByPerson, setJointRotationsByPerson] = useState({})
  const [language, setLanguage] = useState('zh')
  const [showJoints, setShowJoints] = useState(true)
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null)
  const [sessionMeta, setSessionMeta] = useState(null)
  const [cachedImageInfo, setCachedImageInfo] = useState(null)
  const [restoringSession, setRestoringSession] = useState(true)
  const [measurementsByPerson, setMeasurementsByPerson] = useState({})
  const [targetHeightInputs, setTargetHeightInputs] = useState({})
  const [measurementLoading, setMeasurementLoading] = useState(false)
  const [measurementError, setMeasurementError] = useState(null)
  const [isMeasurementOverlayOpen, setIsMeasurementOverlayOpen] = useState(false)
  const pollAttemptRef = useRef(0)

  const persistSessionState = useCallback((payload) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(payload))
  }, [])

  const clearSessionCache = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(SESSION_CACHE_KEY)
  }, [])

  const handleImageUpload = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    setRigData(null)
    setSessionMeta(null)
    setMeasurementsByPerson({})
    setTargetHeightInputs({})
    setMeasurementLoading(false)
    setMeasurementError(null)

    try {
      const imageDataUrl = await readFileAsDataUrl(file)
      setUploadedImageUrl(imageDataUrl)
      setCachedImageInfo({
        dataUrl: imageDataUrl,
        name: file.name,
        type: file.type || 'image/png',
        size: file.size,
        lastModified: file.lastModified
      })

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok && response.status !== 202) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit image')
      }

      const data = await response.json()
      if (!data.session_id) {
        throw new Error('Missing session id from server')
      }

      setSelectedPerson(0)
      setJointRotationsByPerson({})
      setSessionMeta({
        sessionId: data.session_id,
        status: data.status || 'queued',
        numPersons: data.num_persons || 0
      })
      pollAttemptRef.current = 0
      setRestoringSession(false)
    } catch (err) {
      setError(err.message)
      console.error('Upload error:', err)
      setLoading(false)
      setRestoringSession(false)
    }
  }, [])

  const handleJointRotationChange = useCallback((jointName, axis, value) => {
    setJointRotationsByPerson(prev => ({
      ...prev,
      [selectedPerson]: {
        ...(prev[selectedPerson] || {}),
        [jointName]: {
          ...(prev[selectedPerson]?.[jointName] || { x: 0, y: 0, z: 0 }),
          [axis]: value
        }
      }
    }))
  }, [selectedPerson])

  const handleResetPose = useCallback(() => {
    setJointRotationsByPerson(prev => ({
      ...prev,
      [selectedPerson]: {}
    }))
  }, [selectedPerson])

  // Get current person's joint rotations & measurements
  const currentJointRotations = jointRotationsByPerson[selectedPerson] || {}
  const currentMeasurement = measurementsByPerson[selectedPerson]
  const targetHeightValue = targetHeightInputs[selectedPerson] ??
    (currentMeasurement?.target_height_cm ? Number(currentMeasurement.target_height_cm).toFixed(1) : '')

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en')
  }, [])

  const handleClearSession = useCallback(() => {
    clearSessionCache()
    setRigData(null)
    setSessionMeta(null)
    setSelectedPerson(0)
    setJointRotationsByPerson({})
    setMeasurementsByPerson({})
    setTargetHeightInputs({})
    setUploadedImageUrl(null)
    setCachedImageInfo(null)
    setError(null)
    setLoading(false)
    setMeasurementLoading(false)
    setMeasurementError(null)
    setIsMeasurementOverlayOpen(false)
    setRestoringSession(false)
    pollAttemptRef.current = 0
  }, [clearSessionCache])

  const handleReprocess = useCallback(() => {
    if (!cachedImageInfo?.dataUrl || loading) return
    const file = dataUrlToFile(
      cachedImageInfo.dataUrl,
      cachedImageInfo.name || 'cached-upload.png',
      cachedImageInfo.type || 'image/png'
    )
    handleImageUpload(file)
  }, [cachedImageInfo, handleImageUpload, loading])

  const fetchMeasurements = useCallback(async (personIndex, targetHeightCm) => {
    if (!sessionMeta?.sessionId) return
    setMeasurementLoading(true)
    setMeasurementError(null)

    try {
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionMeta.sessionId,
          person_index: personIndex,
          target_height_cm: targetHeightCm
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to compute measurements')
      }

      const data = await res.json()
      setMeasurementsByPerson(prev => ({
        ...prev,
        [personIndex]: {
          ...data,
          fetchedAt: Date.now()
        }
      }))
      const normalizedHeight = typeof data.target_height_cm === 'number'
        ? data.target_height_cm
        : Number.parseFloat(data.target_height_cm ?? '')
      setTargetHeightInputs(prev => ({
        ...prev,
        [personIndex]: Number.isFinite(normalizedHeight) ? normalizedHeight.toFixed(1) : ''
      }))
    } catch (err) {
      console.error('Measurement error:', err)
      setMeasurementError(err.message)
    } finally {
      setMeasurementLoading(false)
    }
  }, [sessionMeta?.sessionId])

  const handleMeasurementHeightChange = useCallback((personIndex, value) => {
    setTargetHeightInputs(prev => ({
      ...prev,
      [personIndex]: value
    }))
    setMeasurementError(null)
  }, [])

  const handleMeasurementApply = useCallback((personIndex, value) => {
    const trimmed = (value ?? '').trim()
    if (!trimmed) {
      setMeasurementError(language === 'zh' ? '请输入目标身高' : 'Please enter a target height')
      return
    }

    const parsed = parseFloat(trimmed)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setMeasurementError(language === 'zh' ? '目标身高必须为正数' : 'Target height must be a positive number')
      return
    }
    fetchMeasurements(personIndex, parsed)
  }, [fetchMeasurements, language])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const cachedRaw = window.localStorage.getItem(SESSION_CACHE_KEY)
    if (!cachedRaw) {
      setRestoringSession(false)
      return
    }

    try {
      const cached = JSON.parse(cachedRaw)
      if (cached.language) {
        setLanguage(cached.language)
      }
      if (typeof cached.showJoints === 'boolean') {
        setShowJoints(cached.showJoints)
      }
      if (typeof cached.selectedPerson === 'number') {
        setSelectedPerson(cached.selectedPerson)
      }
      if (cached.jointRotationsByPerson) {
        setJointRotationsByPerson(cached.jointRotationsByPerson)
      }
      if (cached.uploadedImage?.dataUrl) {
        setUploadedImageUrl(cached.uploadedImage.dataUrl)
        setCachedImageInfo(cached.uploadedImage)
      }
      if (cached.sessionId) {
        setLoading(true)
        setSessionMeta({
          sessionId: cached.sessionId,
          status: cached.status || 'queued',
          numPersons: cached.numPersons || 0
        })
        return
      }
    } catch (err) {
      console.error('Invalid cached session data', err)
      clearSessionCache()
    }

    setRestoringSession(false)
  }, [clearSessionCache])

  useEffect(() => {
    pollAttemptRef.current = 0
  }, [sessionMeta?.sessionId])

  useEffect(() => {
    const sessionId = sessionMeta?.sessionId
    const status = sessionMeta?.status

    if (!sessionId) return
    if (status === 'failed') {
      setLoading(false)
      setRestoringSession(false)
      return
    }
    if (status === 'completed' && rigData?.rig_data?.length) {
      setLoading(false)
      setRestoringSession(false)
      return
    }

    let cancelled = false
    let timeoutId

    const poll = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) {
          if (res.status === 404) {
            clearSessionCache()
            if (!cancelled) {
              setError('Session expired or not found')
              setLoading(false)
              setRestoringSession(false)
              setSessionMeta(null)
            }
            return
          }
          throw new Error('Failed to fetch session status')
        }

        const data = await res.json()
        if (cancelled) {
          return
        }

        setSessionMeta(prev => ({
          sessionId: data.session_id,
          status: data.status,
          numPersons: data.num_persons ?? prev?.numPersons ?? 0
        }))

        if (data.status === 'completed' && data.rig_data) {
          setRigData({
            success: true,
            session_id: data.session_id,
            num_persons: data.num_persons,
            rig_data: data.rig_data
          })
          setSelectedPerson(0)
          setJointRotationsByPerson({})
          setLoading(false)
          setRestoringSession(false)
          pollAttemptRef.current = 0
          return
        }

        if (data.status === 'failed') {
          setError(data.error || 'Processing failed')
          setLoading(false)
          setRestoringSession(false)
          pollAttemptRef.current = 0
          return
        }
      } catch (pollErr) {
        if (!cancelled) {
          console.error('Session polling failed', pollErr)
        }
      }

      if (!cancelled) {
        const baseDelay = status === 'processing' ? 3000 : 4000
        const multiplier = Math.pow(1.5, pollAttemptRef.current)
        const delay = Math.min(baseDelay * multiplier, 15000)
        pollAttemptRef.current += 1
        timeoutId = setTimeout(poll, delay)
      }
    }

    poll()

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [sessionMeta?.sessionId, sessionMeta?.status, rigData, clearSessionCache])

  useEffect(() => {
    if (!sessionMeta) return
    persistSessionState({
      sessionId: sessionMeta.sessionId,
      status: sessionMeta.status,
      numPersons: sessionMeta.numPersons,
      selectedPerson,
      jointRotationsByPerson,
      language,
      showJoints,
      uploadedImage: cachedImageInfo || null
    })
  }, [
    sessionMeta,
    cachedImageInfo,
    selectedPerson,
    jointRotationsByPerson,
    language,
    showJoints,
    persistSessionState
  ])

  const handleToggleMeasurementOverlay = useCallback((nextState) => {
    setIsMeasurementOverlayOpen(prev => typeof nextState === 'boolean' ? nextState : !prev)
  }, [])

  const handleMeasurementExport = useCallback(() => {
    const payload = measurementsByPerson[selectedPerson]
    if (!payload) {
      setMeasurementError(language === 'zh' ? '请先生成测量数据' : 'Generate measurements first')
      return
    }
    const t = translations[language]
    const rows = [['key', 'label', 'value', 'unit']]
    Object.entries(payload.measurements || {}).forEach(([key, value]) => {
      const meta = payload.schema?.[key]
      const unitLabel = meta?.unit === 'deg'
        ? t.measurementUnits.deg
        : t.measurementUnits.cm
      const label = t.measurementLabels[key] || key
      rows.push([
        key,
        label,
        typeof value === 'number' ? value : '',
        unitLabel
      ])
    })

    const csvContent = rows.map(row => row.map(field => {
      if (typeof field === 'number') return field
      const text = String(field ?? '')
      if (text.includes(',') || text.includes('"')) {
        return `"${text.replace(/"/g, '""')}"`
      }
      return text
    }).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `person-${selectedPerson + 1}-measurements.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [measurementsByPerson, selectedPerson, language])

  useEffect(() => {
    if (!rigData) {
      setIsMeasurementOverlayOpen(false)
    }
  }, [rigData])

  const t = translations[language]

  return (
    <LanguageContext.Provider value={language}>
      <Flex className="app-container" gap="0" style={{ width: '100%', height: '100vh' }}>
        <Box className="left-panel">
          <UploadPanel
            onUpload={handleImageUpload}
            loading={loading}
            error={error}
            language={language}
            onToggleLanguage={toggleLanguage}
            imagePreviewUrl={uploadedImageUrl}
            onClearSession={handleClearSession}
            onReprocess={handleReprocess}
            hasCachedResult={Boolean(sessionMeta?.status === 'completed' && rigData)}
            restoringSession={restoringSession}
            sessionStatus={sessionMeta?.status}
          />

          {rigData && (
            <ControlPanel
              rigData={rigData}
              selectedPerson={selectedPerson}
              onPersonSelect={setSelectedPerson}
              jointRotations={currentJointRotations}
              onJointRotationChange={handleJointRotationChange}
              onResetPose={handleResetPose}
              showJoints={showJoints}
              onToggleJoints={setShowJoints}
              language={language}
            />
          )}
        </Box>

        <Box className="right-panel">
          <div className="viewer-stage">
            <ViewerPanel
              allRigData={rigData?.rig_data}
              selectedPerson={selectedPerson}
              onPersonSelect={setSelectedPerson}
              jointRotations={currentJointRotations}
              jointRotationsByPerson={jointRotationsByPerson}
              showJoints={showJoints}
              language={language}
            />

            {rigData && (
              <div className="viewer-toolbar">
                <Button
                  size="2"
                  variant={isMeasurementOverlayOpen ? 'solid' : 'surface'}
                  onClick={() => handleToggleMeasurementOverlay()}
                >
                  {t.measurementPanel.openButton}
                </Button>
              </div>
            )}

            <MeasurementOverlay
              language={language}
              selectedPerson={selectedPerson}
              visible={isMeasurementOverlayOpen}
              onClose={() => handleToggleMeasurementOverlay(false)}
              measurementData={currentMeasurement}
              measurementError={measurementError}
              measurementLoading={measurementLoading}
              targetHeightValue={targetHeightValue}
              onTargetHeightChange={(value) => handleMeasurementHeightChange(selectedPerson, value)}
              onApply={(value) => handleMeasurementApply(selectedPerson, value)}
              onExport={handleMeasurementExport}
            />
          </div>
        </Box>
      </Flex>
    </LanguageContext.Provider>
  )
}

export default App
