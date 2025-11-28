import { Box, Heading, Text, Flex, Button, TextField, Table, Badge, IconButton, Separator } from '@radix-ui/themes'
import { Ruler, AlertCircle, RefreshCw, X, Download } from 'lucide-react'
import { translations } from '../i18n'
import './MeasurementPanel.css'

const MEASUREMENT_GROUPS = [
  {
    key: 'vertical',
    keys: ['body_height', 'eye_height', 'cervicale_height', 'waist_height', 'hip_height', 'inside_leg_height', 'knee_height']
  },
  {
    key: 'girths',
    keys: [
      'head_girth',
      'neck_girth',
      'bust_girth',
      'underbust_girth',
      'waist_girth',
      'hip_girth',
      'thigh_girth',
      'knee_girth',
      'calf_girth',
      'ankle_girth',
      'upper_arm_girth',
      'wrist_girth'
    ]
  },
  {
    key: 'widths',
    keys: ['shoulder_width', 'back_width', 'chest_width']
  },
  {
    key: 'special',
    keys: ['arm_length', 'total_crotch_length']
  },
  {
    key: 'angle',
    keys: ['shoulder_slope']
  }
]

const unitSymbol = (t, unit) => {
  if (unit === 'deg') return t.measurementUnits.deg
  return t.measurementUnits.cm
}

const formatValue = (value, unit) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—'
  }
  const digits = unit === 'deg' ? 2 : 1
  return value.toFixed(digits)
}

export default function MeasurementOverlay({
  language,
  visible,
  onClose,
  onExport,
  measurementData,
  measurementLoading,
  measurementError,
  targetHeightValue,
  onTargetHeightChange,
  onApply,
  selectedPerson
}) {
  if (!visible) return null

  const t = translations[language]
  const measurements = measurementData?.measurements || {}
  const schema = measurementData?.schema || {}
  const trimmedInput = (targetHeightValue ?? '').trim()
  const canSubmit = trimmedInput.length > 0 && !measurementLoading

  const handleSubmit = (evt) => {
    evt.preventDefault()
    if (!trimmedInput) {
      return
    }
    onApply(trimmedInput)
  }

  const summaryStats = measurementData
    ? [
        {
          label: t.measurementPanel.actualHeight,
          value: `${formatValue(measurementData.actual_height_cm, 'cm')} ${unitSymbol(t, 'cm')}`
        },
        {
          label: t.measurementPanel.scaledHeight,
          value: `${formatValue(measurementData.target_height_cm, 'cm')} ${unitSymbol(t, 'cm')}`
        },
        {
          label: t.measurementPanel.scaleFactor,
          value: measurementData.scale_factor?.toFixed(3)
        }
      ]
    : []

  return (
    <div className="measurement-overlay">
      <Box className="measurement-panel measurement-panel--overlay">
        <Flex align="center" justify="between" mb="1" gap="3" className="measurement-panel__header">
          <div>
            <Heading size="4">{t.measurementPanel.title}</Heading>
            <Text size="2" color="gray" className="measurement-panel__subtitle">
              {t.measurementPanel.subtitle}
            </Text>
          </div>
          <Flex gap="2">
            <Button size="2" variant="soft" onClick={onExport} disabled={!measurementData}>
              <Download size={16} />
              {t.measurementPanel.exportCsv}
            </Button>
            <IconButton variant="ghost" onClick={onClose} aria-label={t.measurementPanel.close}>
              <X size={16} />
            </IconButton>
          </Flex>
        </Flex>

        <Box className="measurement-panel__body">
          <form onSubmit={handleSubmit}>
            <Flex gap="2" align="center" mb="3" className="measurement-panel__controls">
              <Text size="2" weight="medium" style={{ minWidth: 'fit-content' }}>
                {t.measurementPanel.targetHeightLabel}
              </Text>
              <TextField.Root
                value={targetHeightValue}
                onChange={(event) => onTargetHeightChange(event.target.value)}
                placeholder={t.measurementPanel.targetHeightPlaceholder}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="measurement-panel__input"
              />
              <Button type="submit" size="2" disabled={!canSubmit} className="measurement-panel__action">
                {measurementLoading ? <RefreshCw size={16} className="spin" /> : <Ruler size={16} />}
                {t.measurementPanel.action}
              </Button>
            </Flex>
          </form>

          {measurementError && (
            <Box className="measurement-panel__error">
              <Flex gap="2" align="center">
                <AlertCircle size={16} />
                <Text size="2" color="red">
                  {measurementError}
                </Text>
              </Flex>
              <Button variant="ghost" size="1" onClick={() => trimmedInput && onApply(trimmedInput)} disabled={!trimmedInput || measurementLoading}>
                {t.measurementPanel.retry}
              </Button>
            </Box>
          )}

          <Flex gap="3" className="measurement-panel__summary">
            {summaryStats.map(item => (
              <Box key={item.label} className="measurement-panel__summary-card">
                <Text size="1" color="gray">{item.label}</Text>
                <Text size="3" weight="bold">{item.value || '—'}</Text>
              </Box>
            ))}
            <Badge variant="surface" className="measurement-panel__person-pill">
              {t.measurementPanel.personLabel} {selectedPerson + 1}
            </Badge>
          </Flex>

          <Separator my="3" size="4" />

          {measurementLoading && !measurementData && (
            <Box className="measurement-panel__placeholder">
              <Text size="2">{t.measurementPanel.loading}</Text>
            </Box>
          )}

          {!measurementLoading && !measurementData && (
            <Box className="measurement-panel__placeholder">
              <Text size="2" color="gray">{t.measurementPanel.empty}</Text>
            </Box>
          )}

          {measurementData && (
            <div className="measurement-panel__table-wrapper">
              {MEASUREMENT_GROUPS.map(group => {
                const rows = group.keys.map(key => {
                  const value = measurements[key]
                  const meta = schema[key] || {}
                  const label = t.measurementLabels[key] || key
                  const description = t.measurementDescriptions[key]
                  const unit = unitSymbol(t, meta.unit)
                  const hasValue = typeof value === 'number' && Number.isFinite(value)
                  return (
                    <Table.Row key={key}>
                      <Table.Cell>
                        <Text weight="medium">{label}</Text>
                        {description && (
                          <Text as="p" size="1" color="gray">
                            {description}
                          </Text>
                        )}
                      </Table.Cell>
                      <Table.Cell align="right">
                        <Text weight="bold">
                          {formatValue(value, meta.unit)}
                          {hasValue && <span className="measurement-panel__unit"> {unit}</span>}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  )
                })

                const title = t.measurementGroups[group.key] || group.key

                return (
                  <Box key={group.key} className="measurement-panel__group">
                    <Heading size="3" mb="2">{title}</Heading>
                    <Table.Root layout="auto" className="measurement-panel__table">
                      <Table.Body>
                        {rows}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )
              })}
            </div>
          )}
        </Box>
      </Box>
    </div>
  )
}

