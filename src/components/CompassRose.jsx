const INK = '#3a2a1a'
const LACRE = '#8b2020'
const OURO = '#a8863c'
const CLARO = '#efe4c6'

// Uma ponta da rosa: losango dividido ao meio — metade tinta, metade papel.
function Point({ angle, r, w, dark, light }) {
  const rad = (angle * Math.PI) / 180
  const tipX = Math.sin(rad) * r
  const tipY = -Math.cos(rad) * r
  const perp = rad + Math.PI / 2
  const bx = Math.sin(perp) * w
  const by = -Math.cos(perp) * w
  return (
    <g>
      <path d={`M0,0 L${bx},${by} L${tipX},${tipY} Z`} fill={dark} />
      <path
        d={`M0,0 L${-bx},${-by} L${tipX},${tipY} Z`}
        fill={light}
        stroke={INK}
        strokeWidth="0.6"
      />
    </g>
  )
}

function FleurDeLis() {
  return (
    <g fill={INK}>
      <path d="M0,-30 C3.4,-23 3.6,-16 0,-8 C-3.6,-16 -3.4,-23 0,-30 Z" />
      <path d="M-1.5,-12 C-8,-19 -14,-19 -15.5,-12.5 C-16.5,-8 -11,-5.5 -6.5,-8.6 L-2.5,-9.8 Z" />
      <path d="M1.5,-12 C8,-19 14,-19 15.5,-12.5 C16.5,-8 11,-5.5 6.5,-8.6 L2.5,-9.8 Z" />
      <rect x="-6.5" y="-9" width="13" height="2.6" rx="1.2" />
      <path d="M-3.5,-6.4 C-2,-3 2,-3 3.5,-6.4 L2.2,-2.2 L-2.2,-2.2 Z" />
    </g>
  )
}

export function CompassRose({ x, y, scale = 1, simple = false }) {
  const ticks = []
  for (let i = 0; i < 72; i++) {
    const a = (i * 5 * Math.PI) / 180
    const r1 = i % 9 === 0 ? 104 : 108.5
    ticks.push(
      <line
        key={i}
        x1={Math.sin(a) * r1}
        y1={-Math.cos(a) * r1}
        x2={Math.sin(a) * 112}
        y2={-Math.cos(a) * 112}
        stroke={INK}
        strokeWidth={i % 9 === 0 ? 1.4 : 0.7}
      />
    )
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.9">
      {!simple && (
        <>
          <circle r="112" fill="none" stroke={INK} strokeWidth="1.6" />
          <circle r="104" fill="none" stroke={INK} strokeWidth="0.8" />
          <g>{ticks}</g>
        </>
      )}

      {/* 16 pontas de quarto */}
      {!simple &&
        Array.from({ length: 16 }, (_, i) => (
          <Point key={`q${i}`} angle={i * 22.5 + 11.25} r={46} w={5} dark={OURO} light={CLARO} />
        ))}
      {/* 8 pontas intermediárias */}
      {Array.from({ length: 8 }, (_, i) => (
        <Point key={`h${i}`} angle={i * 45 + 22.5} r={simple ? 42 : 70} w={simple ? 5 : 7.5} dark={LACRE} light={CLARO} />
      ))}
      {/* 8 pontas principais */}
      {Array.from({ length: 8 }, (_, i) => (
        <Point key={`p${i}`} angle={i * 45} r={simple ? 62 : 100} w={simple ? 7 : 10} dark={INK} light={CLARO} />
      ))}

      <circle r="10" fill={CLARO} stroke={INK} strokeWidth="1.2" />
      <circle r="4.2" fill={LACRE} />
      <circle r="1.4" fill={OURO} />

      {/* flor-de-lis apontando o Norte */}
      <g transform={`translate(0 ${simple ? -74 : -122})`}>
        <FleurDeLis />
      </g>

      {!simple && (
        <g
          fontFamily="'IM Fell English SC', serif"
          fontSize="17"
          fill={INK}
          textAnchor="middle"
        >
          <text x="126" y="6">L</text>
          <text x="0" y="136">S</text>
          <text x="-126" y="6">O</text>
        </g>
      )}
    </g>
  )
}
