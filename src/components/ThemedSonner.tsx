import { Toaster } from 'sonner'
import { useTheme } from './ThemeProvider'

// Bridges Sonner's `theme` prop to our ThemeProvider so toasts follow the
// user's light/dark/system choice (and live-update when they toggle).
export function ThemedSonner() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{ duration: 4000 }}
    />
  )
}
