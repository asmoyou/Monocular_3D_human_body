import { Box, Text, Flex } from '@radix-ui/themes'
import * as Slider from '@radix-ui/react-slider'
import { translations } from '../i18n'
import './JointControl.css'

export default function JointControl({ jointName, displayName, rotation, onChange, language }) {
  const t = translations[language]

  const handleChange = (axis, values) => {
    const value = (values[0] / 100) * Math.PI * 2 - Math.PI
    onChange(jointName, axis, value)
  }

  const getSliderValue = (radians) => {
    return ((radians + Math.PI) / (Math.PI * 2)) * 100
  }

  return (
    <Box className="joint-control">
      <Text size="2" weight="medium" mb="2" style={{ display: 'block' }}>
        {displayName || jointName}
      </Text>

      <Box className="axis-control">
        <Flex align="center" gap="2" mb="1">
          <Text size="1" className="axis-label axis-x">X</Text>
          <Slider.Root
            className="slider-root"
            value={[getSliderValue(rotation.x)]}
            onValueChange={(values) => handleChange('x', values)}
            min={0}
            max={100}
            step={0.5}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
          <Text size="1" className="value-display">
            {(rotation.x * (180 / Math.PI)).toFixed(0)}°
          </Text>
        </Flex>

        <Flex align="center" gap="2" mb="1">
          <Text size="1" className="axis-label axis-y">Y</Text>
          <Slider.Root
            className="slider-root"
            value={[getSliderValue(rotation.y)]}
            onValueChange={(values) => handleChange('y', values)}
            min={0}
            max={100}
            step={0.5}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
          <Text size="1" className="value-display">
            {(rotation.y * (180 / Math.PI)).toFixed(0)}°
          </Text>
        </Flex>

        <Flex align="center" gap="2">
          <Text size="1" className="axis-label axis-z">Z</Text>
          <Slider.Root
            className="slider-root"
            value={[getSliderValue(rotation.z)]}
            onValueChange={(values) => handleChange('z', values)}
            min={0}
            max={100}
            step={0.5}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
          <Text size="1" className="value-display">
            {(rotation.z * (180 / Math.PI)).toFixed(0)}°
          </Text>
        </Flex>
      </Box>
    </Box>
  )
}
