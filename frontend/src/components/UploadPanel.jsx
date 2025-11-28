import { useCallback, useRef } from 'react'
import { Box, Button, Text, Flex, Heading, Card, IconButton } from '@radix-ui/themes'
import { Upload, AlertCircle, Languages, RefreshCcw, Trash2 } from 'lucide-react'
import { translations } from '../i18n'
import './UploadPanel.css'

export default function UploadPanel({
  onUpload,
  loading,
  error,
  language,
  onToggleLanguage,
  imagePreviewUrl,
  onClearSession,
  onReprocess,
  hasCachedResult,
  restoringSession,
  sessionStatus
}) {
  const fileInputRef = useRef(null)
  const t = translations[language]
  const statusLabel = sessionStatus ? t.processingStatuses?.[sessionStatus] || sessionStatus : null

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }, [onUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onUpload(file)
    }
  }, [onUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  return (
    <Box p="4" style={{ borderBottom: '1px solid var(--gray-6)' }}>
      <Flex justify="between" align="center" mb="3">
        <Heading size="5">{t.title}</Heading>
        <IconButton
          size="2"
          variant="soft"
          onClick={onToggleLanguage}
          title={language === 'en' ? '切换到中文' : 'Switch to English'}
        >
          <Languages size={18} />
        </IconButton>
      </Flex>

      {imagePreviewUrl ? (
        <Card>
          <Box position="relative">
            <img
              src={imagePreviewUrl}
              alt="Uploaded preview"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />
            <Button
              size="2"
              variant="soft"
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px'
              }}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload size={16} />
              {language === 'en' ? 'Replace Image' : '替换图片'}
            </Button>
          </Box>
        </Card>
      ) : (
        <Card>
          <div
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} className="upload-icon" />
            <Text size="2" color="gray" mt="2">
              {loading ? t.processing : t.uploadZone}
            </Text>
            <Text size="1" color="gray" mt="1">
              {t.uploadFormats}
            </Text>
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {error && (
        <Flex mt="3" gap="2" align="center" style={{ color: 'var(--red-9)' }}>
          <AlertCircle size={16} />
          <Text size="2">{error}</Text>
        </Flex>
      )}

      {statusLabel && (
        <Text
          size="2"
          mt="3"
          style={{
            color: sessionStatus === 'failed'
              ? 'var(--red-10)'
              : sessionStatus === 'completed'
                ? 'var(--green-10)'
                : 'var(--gray-11)'
          }}
        >
          {statusLabel}
        </Text>
      )}

      {restoringSession && (
        <Text size="2" color="gray" mt="3">
          {t.restoringSession}
        </Text>
      )}

      {hasCachedResult && !restoringSession && (
        <Box mt="3">
          <Flex gap="2" wrap="wrap">
            <Button
              size="2"
              variant="solid"
              onClick={onReprocess}
              disabled={loading}
            >
              <RefreshCcw size={16} />
              {t.reprocess}
            </Button>
            <Button
              size="2"
              variant="outline"
              onClick={onClearSession}
              disabled={loading}
            >
              <Trash2 size={16} />
              {t.clearResult}
            </Button>
          </Flex>
          <Text size="1" color="gray" mt="2">
            {t.cachedSessionHint}
          </Text>
        </Box>
      )}

      {loading && (
        <Box mt="3">
          <div className="loading-bar"></div>
          <Text size="1" color="gray" mt="2">{t.detectingPose}</Text>
        </Box>
      )}
    </Box>
  )
}
