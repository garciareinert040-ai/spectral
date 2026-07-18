import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useProgress, useUI } from '../store.js'

export function ResetModal() {
  const open = useUI((s) => s.resetOpen)
  const setOpen = useUI((s) => s.setResetOpen)
  const resetAll = useProgress((s) => s.resetAll)
  const keepRef = useRef(null)

  useEffect(() => {
    if (open) keepRef.current?.focus()
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <motion.div
            className="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmar reinício do progresso"
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            <h2>Queimar as cartas e recomeçar?</h2>
            <p>
              Todo o progresso anotado nesta carta virará cinzas: selos, rota do
              Gralha e sequências seladas serão esquecidos.
            </p>
            <p className="aviso">
              (O progresso vive somente neste navegador e aparelho — nada é enviado ao mar.)
            </p>
            <div className="modal-actions">
              <button
                className="wax"
                aria-label="Queimar tudo e recomeçar"
                onClick={() => {
                  resetAll()
                  setOpen(false)
                }}
              >
                <span>Q</span>
              </button>
              <button className="btn-parchment" ref={keepRef} onClick={() => setOpen(false)}>
                Manter as cartas
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
