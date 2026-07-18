import { AnimatePresence, motion } from 'framer-motion'
import { ALL_ITEMS } from '../store.js'
import { useProgress, useUI } from '../store.js'
import { GlyphInner } from './Glyphs.jsx'

const INK = '#3a2a1a'
const LACRE = '#8b2020'
const OURO = '#a8863c'

function Stamp() {
  return (
    <motion.g
      initial={{ scale: 1.55, rotate: -32, opacity: 0 }}
      animate={{ scale: 1, rotate: -14, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 560, damping: 15, mass: 0.7 }}
      style={{ mixBlendMode: 'multiply' }}
    >
      <g opacity="0.82">
        <circle r="14" fill="none" stroke={LACRE} strokeWidth="1.7" />
        <circle r="11" fill="none" stroke={LACRE} strokeWidth="0.7" />
        <text
          y="1.8"
          textAnchor="middle"
          fontFamily="'IM Fell English SC', serif"
          fontSize="4.1"
          letterSpacing="0.55"
          fill={LACRE}
        >
          CONCLUÍDA
        </text>
        <path d="M-5,5 h10" stroke={LACRE} strokeWidth="0.6" />
        <path d="M-5,-4.5 h10" stroke={LACRE} strokeWidth="0.6" />
      </g>
    </motion.g>
  )
}

function Pin({ m, done, selected, onSelect }) {
  const isMission = m.tipo === 'principal' || m.tipo === 'awwg'
  const label = `${m.nome} — ${m.local}${done ? ' (concluída)' : ''}`
  const tipW = Math.min(230, m.nome.length * 6.6 + 18)
  return (
    <g
      className={`pin${done ? ' dimmed' : ''}`}
      transform={`translate(${m.coordenadas.x} ${m.coordenadas.y})`}
      tabIndex={0}
      role="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(m.id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(m.id)
        }
      }}
    >
      {/* alvo de toque invisível (r contido para não roubar toques do vizinho) */}
      <circle r="13" fill="transparent" stroke="none" />

      <circle
        className="focus-ring"
        r="15"
        fill="none"
        stroke={OURO}
        strokeWidth="1.6"
        strokeDasharray="3 3"
      />
      {selected && (
        <circle r="13" fill="none" stroke={OURO} strokeWidth="1.2" strokeDasharray="2 3" opacity="0.9" />
      )}

      <GlyphInner tipo={m.tipo} />

      {isMission && (
        <text
          x="9"
          y="12.5"
          fontFamily="'IM Fell English', serif"
          fontSize="9.5"
          fill={INK}
          opacity="0.8"
        >
          {m.ordem}
        </text>
      )}

      <AnimatePresence>{done && <Stamp key="stamp" />}</AnimatePresence>

      {/* tooltip: tarja de papel */}
      <g className="pin-tip" transform="translate(0 -27) rotate(-2)">
        <rect
          x={-tipW / 2}
          y="-11"
          width={tipW}
          height="19"
          fill="#f2e7cb"
          stroke={INK}
          strokeWidth="0.8"
          rx="1.5"
        />
        <path d={`M${-tipW / 2},-11 l-4,4 M${tipW / 2},8 l4,-4`} stroke={INK} strokeWidth="0.8" opacity="0.5" />
        <text
          y="2.5"
          textAnchor="middle"
          fontFamily="'IM Fell English', serif"
          fontSize="11"
          fill={INK}
        >
          {m.nome}
        </text>
      </g>
    </g>
  )
}

export function Pins() {
  const layers = useProgress((s) => s.layers)
  const completed = useProgress((s) => s.completed)
  const selectedId = useUI((s) => s.selectedId)
  const select = useUI((s) => s.select)
  return (
    <g>
      {ALL_ITEMS.filter((m) => layers[m.tipo]).map((m) => (
        <Pin
          key={m.id}
          m={m}
          done={!!completed[m.id]}
          selected={selectedId === m.id}
          onSelect={select}
        />
      ))}
    </g>
  )
}
