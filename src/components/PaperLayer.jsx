// Fundo de pergaminho: camada FIXA (fora do pan/zoom), então os filtros SVG
// pesados (feTurbulence + feDiffuseLighting) são rasterizados uma única vez.
export function PaperLayer() {
  return (
    <svg className="paper-svg" aria-hidden="true">
      <defs>
        <linearGradient id="paperBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe3c9" />
          <stop offset="0.38" stopColor="#e8dcc0" />
          <stop offset="0.74" stopColor="#dccb9f" />
          <stop offset="1" stopColor="#d4c39a" />
        </linearGradient>
        <filter id="fibers" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="4" seed="7" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="1.7" diffuseConstant="1.05">
            <feDistantLight azimuth="235" elevation="55" />
          </feDiffuseLighting>
        </filter>
        <filter id="mottle" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.005" numOctaves="3" seed="21" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.33  0 0 0 0 0.16  0.9 0 0 0 -0.28"
          />
        </filter>
        <filter id="stainBlur">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* base do papel */}
      <rect width="100%" height="100%" fill="url(#paperBase)" />

      {/* fibras do papel em relevo */}
      <rect width="100%" height="100%" filter="url(#fibers)" style={{ mixBlendMode: 'multiply' }} opacity="0.32" />

      {/* manchas amplas e irregulares de envelhecimento */}
      <rect width="100%" height="100%" filter="url(#mottle)" style={{ mixBlendMode: 'multiply' }} opacity="0.5" />

      {/* manchas localizadas de umidade e café */}
      <g filter="url(#stainBlur)" style={{ mixBlendMode: 'multiply' }}>
        <ellipse cx="14%" cy="22%" rx="9%" ry="6%" fill="#8a6a3a" opacity="0.1" />
        <ellipse cx="82%" cy="12%" rx="7%" ry="5%" fill="#6e4f24" opacity="0.08" />
        <ellipse cx="70%" cy="78%" rx="11%" ry="7%" fill="#8a6a3a" opacity="0.09" />
        <ellipse cx="30%" cy="88%" rx="8%" ry="5%" fill="#75552a" opacity="0.08" />
        <ellipse cx="93%" cy="52%" rx="5%" ry="8%" fill="#6e4f24" opacity="0.09" />
        <ellipse cx="48%" cy="8%" rx="6%" ry="3.5%" fill="#75552a" opacity="0.07" />
        {/* marca de caneca */}
        <circle cx="24%" cy="64%" r="52" fill="none" stroke="#6e4f24" strokeWidth="7" opacity="0.1" />
      </g>
    </svg>
  )
}
