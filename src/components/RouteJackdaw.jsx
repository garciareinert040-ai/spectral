import { motion } from 'framer-motion'
import { MISSIONS, chronoKey, useProgress } from '../store.js'
import { smoothPath } from '../geo/projection.js'

const LACRE = '#8b2020'

function AnchorNode({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={LACRE} strokeWidth="1.5" fill="none" strokeLinecap="round">
      <circle cy="-5.2" r="1.6" />
      <path d="M0,-3.6 V4.6" />
      <path d="M-3.4,-1 H3.4" />
      <path d="M0,4.6 C-3.8,4.6 -6,1.8 -6.2,-0.4 M0,4.6 C3.8,4.6 6,1.8 6.2,-0.4" />
    </g>
  )
}

// Rota do Gralha: liga as missões principais concluídas em ordem cronológica.
export function RouteJackdaw() {
  const completed = useProgress((s) => s.completed)
  const done = MISSIONS.filter((m) => completed[m.id]).sort((a, b) => chronoKey(a) - chronoKey(b))
  if (done.length === 0) return null

  const pts = done.map((m) => [m.coordenadas.x, m.coordenadas.y])
  const d = pts.length >= 2 ? smoothPath(pts, false, 0.8) : ''

  return (
    <g aria-hidden="true">
      {d && (
        <motion.path
          key={done.map((m) => m.id).join('|')}
          d={d}
          fill="none"
          stroke={LACRE}
          strokeWidth="3"
          strokeDasharray="11 9"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ duration: 0.7 }}
        />
      )}
      {done.map((m) => (
        <motion.g
          key={m.id}
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        >
          <AnchorNode x={m.coordenadas.x} y={m.coordenadas.y - 20} />
        </motion.g>
      ))}
    </g>
  )
}
