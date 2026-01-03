'use client'

import { motion } from 'framer-motion'
import { Mic, Loader2 } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const { isRecording, isTranscribing, error, startRecording, stopRecording } = useVoiceInput()

  const handleClick = async () => {
    if (isRecording) {
      const transcript = await stopRecording()
      if (transcript) {
        onTranscript(transcript)
      }
    } else {
      await startRecording()
    }
  }

  const isDisabled = disabled || isTranscribing

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        className={`
          relative inline-flex items-center justify-center
          px-4 py-3 rounded-xl
          font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-950
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRecording
            ? 'bg-red-500 text-white focus:ring-red-400 shadow-lg shadow-red-500/40'
            : 'bg-surface-800/80 border border-surface-700 text-surface-100 hover:bg-surface-700/80 hover:border-surface-600 focus:ring-surface-500 shadow-lg shadow-black/20'
          }
        `}
        title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : error || 'Start voice input'}
      >
        {isTranscribing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <>
            <Mic size={20} />
            {isRecording && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-red-500"
                animate={{ opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </>
        )}
      </motion.button>

      {/* Recording indicator */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
        >
          <motion.div
            className="absolute inset-0 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      )}
    </div>
  )
}
