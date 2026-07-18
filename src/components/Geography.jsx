import { useEffect, useRef, useState } from 'react'
import {
  LANDMASSES, ISLETS, DOT_CHAINS, REGION_LABELS, TOWN_LABELS,
  SEA_LABELS, SMALL_SEA_LABELS, HILLS, RHUMB_CENTERS,
} from '../geo/coastlines.js'

const INK = '#3a2a1a'
const LAND = '#e7d9b6'
const WATERLINE = '#5a6e7a'

// Hachura clássica de gravura: tracinhos perpendiculares à costa, do lado de
// dentro da terra. Gerada uma vez a partir dos paths reais já montados no DOM.
function useCoastTicks(groupRef) {
  const [ticks, setTicks] = useState('')
  useEffect(() => {
    const g = groupRef.current
    if (!g) return
    let seed = 9
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    let d = ''
    g.querySelectorAll('path[data-hatch]').forEach((pathEl) => {
      let len
      try {
        len = pathEl.getTotalLength()
      } catch {
        return
      }
      for (let t = 6; t < len; t += 12.5) {
        if (rand() < 0.2) continue
        const a = pathEl.getPointAtLength(Math.max(0, t - 1.6))
        const b = pathEl.getPointAtLength(Math.min(len, t + 1.6))
        const dx = b.x - a.x
        const dy = b.y - a.y
        const n = Math.hypot(dx, dy) || 1
        let nx = -dy / n
        let ny = dx / n
        const mid = pathEl.getPointAtLength(t)
        let inside = true
        try {
          inside = pathEl.isPointInFill(new DOMPoint(mid.x + nx * 3.2, mid.y + ny * 3.2))
        } catch {
          /* mantém o lado padrão */
        }
        if (!inside) {
          nx = -nx
          ny = -ny
        }
        const l = 4.5 + rand() * 3.4
        d += `M${(mid.x + nx * 1.4).toFixed(1)},${(mid.y + ny * 1.4).toFixed(1)}L${(mid.x + nx * l).toFixed(1)},${(mid.y + ny * l).toFixed(1)}`
      }
    })
    setTicks(d)
  }, [groupRef])
  return ticks
}

function RhumbLines() {
  const lines = []
  RHUMB_CENTERS.forEach(([cx, cy], ci) => {
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 16
      const dx = Math.cos(a) * 2400
      const dy = Math.sin(a) * 2400
      lines.push(
        <line key={`${ci}-${i}`} x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} />
      )
    }
  })
  return (
    <g stroke={INK} strokeWidth="0.8" opacity="0.075">
      {lines}
      {RHUMB_CENTERS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="none" strokeWidth="1" />
      ))}
    </g>
  )
}

function Hill({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth="1.1" fill="none" opacity="0.4">
      <path d="M-13,5 Q-6,-7 1,5" />
      <path d="M-3,5 Q5,-9 13,5" />
      <path d="M2,0 Q5,-3 7,0" strokeWidth="0.8" />
    </g>
  )
}

export function Geography() {
  const landRef = useRef(null)
  const ticks = useCoastTicks(landRef)

  return (
    <g>
      <RhumbLines />

      {/* linhas d'água concêntricas, paralelas à costa (traço de carta antiga) */}
      <g fill="none" stroke={WATERLINE} strokeLinejoin="round">
        {[...LANDMASSES, ...ISLETS].map(({ id, d }) => (
          <g key={id}>
            <path d={d} strokeWidth="34" opacity="0.05" />
            <path d={d} strokeWidth="20" opacity="0.075" />
            <path d={d} strokeWidth="9" opacity="0.1" />
          </g>
        ))}
      </g>

      {/* terra firme */}
      <g ref={landRef}>
        {LANDMASSES.map(({ id, d }) => (
          <path
            key={id}
            data-hatch=""
            d={d}
            fill={LAND}
            stroke={INK}
            strokeWidth="2.1"
            strokeLinejoin="round"
            opacity="0.96"
          />
        ))}
        {ISLETS.map(({ id, d }) => (
          <path key={id} d={d} fill={LAND} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" opacity="0.95" />
        ))}
      </g>

      {/* hachura interna perpendicular à costa */}
      {ticks && <path d={ticks} stroke={INK} strokeWidth="0.75" opacity="0.42" fill="none" />}

      {/* recifes, chaves e bancos de areia */}
      <g fill={LAND} stroke={INK} strokeWidth="0.9">
        {DOT_CHAINS.flat().map(([x, y], i) => (
          <ellipse key={i} cx={x} cy={y} rx={4.2} ry={2.7} transform={`rotate(${(i * 37) % 40 - 20} ${x} ${y})`} />
        ))}
      </g>

      {/* colinas decorativas */}
      {HILLS.map(([x, y], i) => (
        <Hill key={i} x={x} y={y} />
      ))}

      {/* rótulos de mar (em arco) */}
      <defs>
        {SEA_LABELS.map(([texto, d], i) => (
          <path key={i} id={`sea-arc-${i}`} d={d} />
        ))}
      </defs>
      {SEA_LABELS.map(([texto, , size, spacing], i) => (
        <text
          key={texto}
          fontFamily="'IM Fell English SC', serif"
          fontSize={size}
          letterSpacing={spacing}
          fill={INK}
          opacity="0.5"
        >
          <textPath href={`#sea-arc-${i}`} startOffset="50%" textAnchor="middle">
            {texto}
          </textPath>
        </text>
      ))}
      {SMALL_SEA_LABELS.map(([texto, x, y, rot]) => (
        <text
          key={texto}
          x={x}
          y={y}
          transform={`rotate(${rot} ${x} ${y})`}
          textAnchor="middle"
          fontFamily="'IM Fell English', serif"
          fontStyle="italic"
          fontSize="13"
          letterSpacing="2"
          fill={INK}
          opacity="0.55"
        >
          {texto}
        </text>
      ))}

      {/* rótulos de região */}
      {REGION_LABELS.map(([texto, x, y, size, rot, spacing]) => (
        <text
          key={texto}
          x={x}
          y={y}
          transform={`rotate(${rot} ${x} ${y})`}
          textAnchor="middle"
          fontFamily="'IM Fell English SC', serif"
          fontSize={size}
          letterSpacing={spacing}
          fill={INK}
          opacity="0.62"
        >
          {texto}
        </text>
      ))}

      {/* vilas e portos */}
      {TOWN_LABELS.map(([nome, x, y, rot, px, py]) => (
        <g key={nome}>
          {px != null && (
            <>
              <circle cx={px} cy={py} r="3" fill="none" stroke={INK} strokeWidth="1.2" />
              <circle cx={px} cy={py} r="0.9" fill={INK} />
            </>
          )}
          <text
            x={x}
            y={y}
            transform={`rotate(${rot} ${x} ${y})`}
            textAnchor="middle"
            fontFamily="'IM Fell English', serif"
            fontStyle="italic"
            fontSize="14.5"
            letterSpacing="1"
            fill={INK}
            opacity="0.85"
          >
            {nome}
          </text>
        </g>
      ))}
    </g>
  )
}
