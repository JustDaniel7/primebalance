// src/hooks/useVoiceInput.ts
// Hook for voice input using MediaRecorder and Whisper transcription

import { useState, useRef, useCallback } from 'react'

interface UseVoiceInputReturn {
  isRecording: boolean
  isTranscribing: boolean
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<string | null>
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)

    try {
      // Check for browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Voice recording is not supported in this browser')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Use webm format which is widely supported
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording'
      setError(message)
      console.error('Recording error:', err)
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        mediaRecorder.stream.getTracks().forEach(track => track.stop())

        setIsRecording(false)
        setIsTranscribing(true)
        setError(null)

        try {
          // Create audio blob
          const mimeType = mediaRecorder.mimeType
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })

          // Get the file extension from mime type
          const extension = mimeType.includes('webm') ? 'webm' : 'mp4'

          // Create FormData with the audio file
          const formData = new FormData()
          formData.append('audio', audioBlob, `recording.${extension}`)

          // Send to transcription API
          const response = await fetch('/api/ai/transcribe', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data.error || 'Transcription failed')
          }

          const data = await response.json()
          resolve(data.text || null)

        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to transcribe audio'
          setError(message)
          console.error('Transcription error:', err)
          resolve(null)
        } finally {
          setIsTranscribing(false)
          chunksRef.current = []
        }
      }

      mediaRecorder.stop()
    })
  }, [isRecording])

  return {
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording
  }
}
