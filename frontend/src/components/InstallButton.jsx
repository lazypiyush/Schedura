import { useEffect, useState } from 'react'
import './InstallButton.css'

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    console.log(`User response: ${outcome}`)
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  if (!showInstall) return null

  return (
    <button className="install-button" onClick={handleInstall}>
      <span className="install-icon">⬇️</span>
      Install App
    </button>
  )
}

export default InstallButton
