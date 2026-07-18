const INK = '#3a2a1a'
const LACRE = '#8b2020'
const OURO = '#a8863c'
const CLARO = '#efe4c6'

// Glifo de cada camada, desenhado centrado em (0,0) num raio ~9.
// Usado nos pins do mapa, na legenda e nas etiquetas de filtro.
export function GlyphInner({ tipo }) {
  switch (tipo) {
    case 'principal':
      return (
        <g stroke={LACRE} strokeWidth="2.7" strokeLinecap="round" fill="none">
          <path d="M-6.5,-5.5 C-2.5,-2.5 2.5,2.5 6.5,5.5" />
          <path d="M6.5,-5.5 C2.5,-2.5 -2.5,2.5 -6.5,5.5" />
        </g>
      )
    case 'awwg':
      return (
        <g>
          <circle r="7.6" fill="#c9a44f" stroke="#6d5118" strokeWidth="1.3" />
          <circle r="5.6" fill="none" stroke="#6d5118" strokeWidth="0.7" opacity="0.8" />
          <text
            y="3.4"
            textAnchor="middle"
            fontFamily="'IM Fell English', serif"
            fontSize="9.5"
            fill="#4d3608"
          >
            8
          </text>
        </g>
      )
    case 'cacadas':
      return (
        <path
          d="M-1.7,-8.5 L1.7,-8.5 L1,-1.7 L8.5,-2.4 L8.5,2.4 L1,1.7 L1.7,8.5 L-1.7,8.5 L-1,1.7 L-8.5,2.4 L-8.5,-2.4 L-1,-1.7 Z"
          fill={LACRE}
          stroke="#5e1414"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      )
    case 'contratos':
      return (
        <g stroke={INK} strokeWidth="1.4" fill={CLARO}>
          <path d="M-8.5,-4.5 C-10.5,-4.5 -10.5,4.5 -8.5,4.5 L6,4.5 C8,4.5 8,-4.5 6,-4.5 Z" />
          <ellipse cx="6.6" cy="0" rx="2" ry="4.4" />
          <path d="M-6,-1.5 H3 M-6,1.5 H1.5" strokeWidth="0.8" fill="none" opacity="0.8" />
        </g>
      )
    case 'lendarios':
      return (
        <g stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none">
          <path d="M-8,3 C-5,7.5 5,7.5 8,3 L6,0.5 L-7,0.5 Z" fill={INK} fillOpacity="0.15" strokeLinejoin="round" />
          <path d="M0,0.5 V-8.5" />
          <path d="M0,-8.5 C4.5,-6.5 4.5,-3 0,-1.5 Z" fill={INK} fillOpacity="0.25" />
          <path d="M0,-8.5 L-3.4,-7.6" strokeWidth="1" stroke={LACRE} />
        </g>
      )
    case 'fortes':
      return (
        <g stroke={INK} strokeWidth="1.4" strokeLinejoin="round" fill={CLARO}>
          <path d="M-6.5,7 V-2.5 H-4 V-6 H-1.4 V-2.5 H1.4 V-6 H4 V-2.5 H6.5 V7 Z" />
          <path d="M-1.4,7 V2.4 H1.4 V7" fill="none" strokeWidth="1" />
        </g>
      )
    case 'oficiais':
      return (
        <g>
          <path
            d="M-8.5,2.5 C-6,-6.5 6,-6.5 8.5,2.5 C4.5,0.4 -4.5,0.4 -8.5,2.5 Z"
            fill={INK}
            stroke="#241708"
            strokeWidth="0.7"
            strokeLinejoin="round"
          />
          <path d="M-8.5,2.5 C-4.5,4.8 4.5,4.8 8.5,2.5" fill="none" stroke={OURO} strokeWidth="1.2" />
        </g>
      )
    default:
      return <circle r="5" fill={INK} />
  }
}

export function LayerGlyph({ tipo, size = 18 }) {
  return (
    <svg viewBox="-11 -11 22 22" width={size} height={size} aria-hidden="true">
      <GlyphInner tipo={tipo} />
    </svg>
  )
}
