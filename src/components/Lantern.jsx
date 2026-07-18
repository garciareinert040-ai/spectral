import { useEffect, useRef } from 'react'
import { useUI } from '../store.js'

// Modo lanterna: escurece a carta e ilumina um círculo ao redor do cursor,
// como quem explora o mapa à luz de vela. Posição via CSS vars, sem re-render.
export function Lantern() {
  const on = useUI((s) => s.lantern)
  const ref = useRef(null)

  useEffect(() => {
    if (!on) return
    const el = ref.current
    const move = (e) => {
      if (!el) return
      el.style.setProperty('--lx', `${e.clientX}px`)
      el.style.setProperty('--ly', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [on])

  if (!on) return null
  return <div ref={ref} className="lantern-overlay" aria-hidden="true" />
}
