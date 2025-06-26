"use client"

import * as React from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationProps {
  type: 'success' | 'error'
  message: string
  onClose?: () => void
  className?: string
}

export function Notification({ type, message, onClose, className }: NotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border animate-in slide-in-from-top-2 duration-300",
        type === 'success' 
          ? "bg-green-50 border-green-200 text-green-800" 
          : "bg-red-50 border-red-200 text-red-800",
        className
      )}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      )}
      
      <span className="flex-1 text-sm font-medium">{message}</span>
      
      {onClose && (
        <button
          onClick={handleClose}
          className={cn(
            "rounded-sm opacity-70 hover:opacity-100 transition-opacity",
            type === 'success' ? "hover:bg-green-100" : "hover:bg-red-100"
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

// Context for managing notifications
interface NotificationContextType {
  notifications: (NotificationProps & { id: string })[]
  showSuccess: (message: string) => void
  showError: (message: string) => void
  removeNotification: (id: string) => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<(NotificationProps & { id: string })[]>([])

  const showSuccess = React.useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, type: 'success', message }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  const showError = React.useCallback((message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, type: 'error', message }])
    
    // Auto-remove after 7 seconds (errors stay longer)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 7000)
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, showSuccess, showError, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = React.useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

// Container component to render notifications
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
} 