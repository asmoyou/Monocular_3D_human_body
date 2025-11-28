import '@radix-ui/themes/styles.css'
import './index.css'

import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import App from './App.jsx'

// Disable StrictMode to prevent double rendering which breaks Three.js
createRoot(document.getElementById('root')).render(
  <Theme appearance="dark" accentColor="blue" grayColor="slate" radius="medium">
    <App />
  </Theme>
)
