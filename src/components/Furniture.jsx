import { LAYER_DEFS } from '../store.js'
import { LayerGlyph } from './Glyphs.jsx'

const INK = '#3a2a1a'
const LACRE = '#8b2020'
const OURO = '#a8863c'

function Volute({ transform }) {
  return (
    <g transform={transform} fill="none" stroke={OURO} strokeWidth="1.8" strokeLinecap="round">
      <path d="M0,16 C-10,16 -14,7 -8,2 C-3,-2 3,1 2,6 C1.4,9.6 -2.6,10.4 -4,7.6" />
      <path d="M0,16 C10,10 20,12 26,18" strokeWidth="1.2" opacity="0.8" />
    </g>
  )
}

export function Cartouche() {
  return (
    <svg className="cartouche" viewBox="0 0 400 152" aria-hidden="false" role="img" aria-label="Título: Mar das Caraíbas, Anno Domini 1715 — Cartas de Navegação do Capitão Kenway">
      {/* leve escurecimento do papel sob o cartouche */}
      <rect x="8" y="8" width="384" height="136" rx="10" fill="#785424" opacity="0.07" />
      <rect x="10" y="10" width="380" height="132" rx="8" fill="none" stroke={INK} strokeWidth="2" />
      <rect x="16" y="16" width="368" height="120" rx="5" fill="none" stroke={OURO} strokeWidth="1" />

      {/* volutas nos cantos */}
      <Volute transform="translate(24 18)" />
      <Volute transform="translate(376 18) scale(-1 1)" />
      <Volute transform="translate(24 134) scale(1 -1)" />
      <Volute transform="translate(376 134) scale(-1 -1)" />

      {/* concha barroca no topo */}
      <g transform="translate(200 12)" stroke={OURO} fill="none" strokeWidth="1.4">
        <path d="M-14,4 C-14,-6 14,-6 14,4 M-9,3 C-9,-3 -3,-4 -3,3 M9,3 C9,-3 3,-4 3,3 M0,-4 V3" />
      </g>

      <text
        x="200"
        y="60"
        textAnchor="middle"
        fontFamily="'Pirata One', cursive"
        fontSize="31"
        letterSpacing="2.5"
        fill={INK}
      >
        MAR DAS CARAÍBAS
      </text>
      <text
        x="200"
        y="86"
        textAnchor="middle"
        fontFamily="'IM Fell English SC', serif"
        fontSize="15.5"
        letterSpacing="4"
        fill={LACRE}
      >
        Anno Domini 1715
      </text>
      <path d="M120,98 H280 M186,98 l14,-4 14,4 -14,4 Z" stroke={OURO} strokeWidth="1" fill="#e7d9b6" />
      <text
        x="200"
        y="120"
        textAnchor="middle"
        fontFamily="'IM Fell English', serif"
        fontStyle="italic"
        fontSize="14.5"
        letterSpacing="1"
        fill={INK}
        opacity="0.85"
      >
        Cartas de Navegação do Capitão Kenway
      </text>
    </svg>
  )
}

export function ScaleBar() {
  const seg = 44
  return (
    <svg className="scalebar" viewBox="0 0 250 56" aria-hidden="true">
      <text x="125" y="14" textAnchor="middle" fontFamily="'IM Fell English', serif" fontStyle="italic" fontSize="13" fill={INK} opacity="0.8">
        Escala de Léguas Espanholas
      </text>
      <g transform="translate(14 22)">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={i * seg}
            y="0"
            width={seg}
            height="8"
            fill={i % 2 === 0 ? INK : 'none'}
            fillOpacity={i % 2 === 0 ? 0.75 : 1}
            stroke={INK}
            strokeWidth="1.1"
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <text
            key={i}
            x={i * seg}
            y="24"
            textAnchor="middle"
            fontFamily="'IM Fell English', serif"
            fontSize="11.5"
            fill={INK}
            opacity="0.75"
          >
            {i * 5}
          </text>
        ))}
      </g>
    </svg>
  )
}

export function Graticule() {
  const lons = [88, 86, 84, 82, 80, 78, 76, 74, 72]
  const lats = [26, 24, 22, 20, 18, 16]
  return (
    <div className="graticule" aria-hidden="true">
      {lons.map((lon) => {
        const left = `${(((89.5 - lon) / 19) * 100).toFixed(1)}%`
        return (
          <span key={`t${lon}`} className="top" style={{ left }}>
            {lon}°O
          </span>
        )
      })}
      {lons.map((lon) => {
        const left = `${(((89.5 - lon) / 19) * 100).toFixed(1)}%`
        return (
          <span key={`b${lon}`} className="bottom" style={{ left }}>
            {lon}°O
          </span>
        )
      })}
      {lats.map((lat) => {
        const top = `${(((27.5 - lat) / 12) * 100).toFixed(1)}%`
        return (
          <span key={`l${lat}`} className="left" style={{ top }}>
            {lat}°N
          </span>
        )
      })}
      {lats.map((lat) => {
        const top = `${(((27.5 - lat) / 12) * 100).toFixed(1)}%`
        return (
          <span key={`r${lat}`} className="right" style={{ top }}>
            {lat}°N
          </span>
        )
      })}
    </div>
  )
}

export function LegendBox() {
  return (
    <div className="legendbox">
      <svg viewBox="0 0 218 252" style={{ width: '100%', display: 'block' }} aria-label="Legenda cartográfica" role="img">
        <rect x="4" y="4" width="210" height="244" rx="7" fill="#785424" opacity="0.07" />
        <rect x="5" y="5" width="208" height="242" rx="6" fill="none" stroke={INK} strokeWidth="1.6" />
        <rect x="10" y="10" width="198" height="232" rx="4" fill="none" stroke={OURO} strokeWidth="0.9" />
        <text x="109" y="30" textAnchor="middle" fontFamily="'IM Fell English SC', serif" fontSize="15" letterSpacing="4" fill={INK}>
          LEGENDA
        </text>
        <path d="M60,38 H158" stroke={OURO} strokeWidth="1" />
        {LAYER_DEFS.map((l, i) => (
          <g key={l.key} transform={`translate(28 ${58 + i * 24})`}>
            <g transform="scale(0.95)">
              <foreignObject x="-11" y="-11" width="22" height="22">
                <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LayerGlyph tipo={l.key} size={19} />
                </div>
              </foreignObject>
            </g>
            <text x="22" y="4.5" fontFamily="'IM Fell English', serif" fontSize="13.5" fill={INK}>
              {legendLabel(l.key)}
            </text>
          </g>
        ))}
        {/* rota do Gralha */}
        <g transform={`translate(28 ${58 + 7 * 24})`}>
          <path d="M-9,0 H10" stroke={LACRE} strokeWidth="2.4" strokeDasharray="5 4" />
          <text x="22" y="4.5" fontFamily="'IM Fell English', serif" fontSize="13.5" fill={INK}>
            Rota do Gralha
          </text>
        </g>
        <text x="109" y={58 + 8 * 24 + 2} textAnchor="middle" fontFamily="'IM Fell English', serif" fontStyle="italic" fontSize="11" fill={INK} opacity="0.7">
          selo vermelho = missão concluída
        </text>
      </svg>
    </div>
  )
}

function legendLabel(key) {
  switch (key) {
    case 'principal': return 'História principal'
    case 'awwg': return 'A World Without Gold'
    case 'cacadas': return 'Caçadas Templárias'
    case 'contratos': return 'Contratos'
    case 'lendarios': return 'Navios Lendários'
    case 'fortes': return 'Fortes Navais'
    case 'oficiais': return 'Missões de Oficiais'
    default: return key
  }
}
