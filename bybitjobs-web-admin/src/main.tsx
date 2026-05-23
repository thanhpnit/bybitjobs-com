import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRegistry } from 'react-native'
import App from './App'

// Ensure React Native Web is properly registered
AppRegistry.registerComponent('App', () => App)
const rootTag = document.getElementById('root')

if (rootTag) {
  createRoot(rootTag).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
