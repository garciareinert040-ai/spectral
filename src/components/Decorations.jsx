const INK = '#3a2a1a'

// Serpente marinha em traço de pena: corcovas emergindo, cabeça de mandíbula
// aberta, nadadeiras e ondinhas nos vãos.
function SeaSerpent({ x, y, scale = 1 }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="none"
      stroke={INK}
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.78"
    >
      {/* cauda */}
      <path d="M-128,26 C-138,20 -140,32 -132,36 M-128,26 L-136,14 L-122,20" strokeWidth="1.6" />
      {/* corcova 1 */}
      <path d="M-120,30 C-108,-4 -84,-6 -70,24" />
      <path d="M-114,14 l-2,-8 M-104,4 l0,-9 M-94,4 l2,-8" strokeWidth="1.3" />
      {/* corcova 2 */}
      <path d="M-52,26 C-36,-16 -6,-18 8,22" />
      <path d="M-44,6 l-3,-9 M-30,-6 l0,-10 M-16,-5 l3,-9" strokeWidth="1.3" />
      {/* corcova 3 */}
      <path d="M24,24 C38,-8 58,-10 70,18" />
      <path d="M32,6 l-2,-8 M46,-3 l1,-9" strokeWidth="1.3" />
      {/* pescoço subindo da última corcova */}
      <path d="M80,22 C96,10 102,-8 92,-24" />
      {/* crânio e mandíbula superior (boca aberta para a esquerda) */}
      <path d="M92,-24 C90,-33 82,-37 72,-35 C63,-37 54,-37 48,-34" />
      <path d="M48,-34 C56,-30 64,-29 72,-28" strokeWidth="1.4" />
      {/* dentes da mandíbula superior */}
      <path d="M54,-34 l1,3 M60,-33.5 l1,3 M66,-33 l1,3" strokeWidth="1" />
      {/* mandíbula inferior */}
      <path d="M72,-28 C64,-26 56,-22 50,-18 C60,-16 70,-17 78,-19 C86,-21 90,-22 92,-24" />
      {/* língua bífida */}
      <path d="M52,-26 C46,-25 42,-27 38,-23 M42,-25 l-4,-3" strokeWidth="1" />
      {/* olho, chifre e crista do pescoço */}
      <circle cx="81" cy="-28" r="1.7" fill={INK} stroke="none" />
      <path d="M84,-35 l3,-7 M89,-14 l8,-3 M91,-5 l8,-1" strokeWidth="1.3" />
      {/* ondinhas nos vãos */}
      <g strokeWidth="1.1" opacity="0.75">
        <path d="M-66,30 q7,5 14,0" />
        <path d="M12,28 q7,5 14,0" />
        <path d="M74,26 q7,5 14,0" />
        <path d="M-140,38 q7,5 14,0" />
      </g>
      {/* segunda passada deslocada — efeito de gravura */}
      <g transform="translate(1 1.2)" opacity="0.25" strokeWidth="1">
        <path d="M-120,30 C-108,-4 -84,-6 -70,24" />
        <path d="M-52,26 C-36,-16 -6,-18 8,22" />
        <path d="M24,24 C38,-8 58,-10 70,18" />
      </g>
    </g>
  )
}

// Galeão de três mastros visto de través, velas pandas e flâmula.
function Galleon({ x, y, scale = 1, flip = false }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
      fill="none"
      stroke={INK}
      strokeWidth="1.8"
      strokeLinecap="round"
      opacity="0.8"
    >
      {/* casco */}
      <path d="M-46,10 C-36,24 28,26 46,8 L52,-2 L40,2 L-44,2 L-52,-4 Z" strokeLinejoin="round" />
      <path d="M-40,7 L38,9 M-36,13 L30,15" strokeWidth="0.9" opacity="0.7" />
      {/* castelo de popa */}
      <path d="M-44,2 L-46,-8 L-30,-8 L-28,2" />
      <path d="M-42,-3 h10" strokeWidth="0.9" />
      {/* gurupés */}
      <path d="M46,0 L66,-14" />
      <path d="M50,-3 C58,-12 62,-13 66,-14 L52,-6 Z" strokeWidth="1.1" fill={INK} fillOpacity="0.06" />
      {/* mastros */}
      <path d="M-20,2 V-54 M8,2 V-64 M32,0 V-42" />
      {/* vergas */}
      <path d="M-34,-46 H-6 M-32,-26 H-8 M-6,-56 H24 M-8,-34 H26 M22,-36 H42" strokeWidth="1.3" />
      {/* velas quadradas pandas */}
      <path d="M-34,-46 C-28,-36 -12,-36 -6,-46 L-6,-28 C-12,-20 -28,-20 -34,-28 Z" strokeWidth="1.2" />
      <path d="M-6,-56 C2,-48 16,-48 24,-56 L24,-38 C16,-30 2,-30 -6,-38 Z" strokeWidth="1.2" />
      <path d="M22,-36 C28,-30 38,-30 42,-36 L42,-22 C38,-16 28,-16 22,-22 Z" strokeWidth="1.2" />
      {/* estai e cordame */}
      <g strokeWidth="0.7" opacity="0.55">
        <path d="M-20,-54 L8,-64 M8,-64 L32,-42 M-20,-54 L-44,0 M32,-42 L52,-2 M8,-64 L64,-13" />
      </g>
      {/* flâmula */}
      <path d="M8,-64 L8,-70 L22,-67 L8,-64" fill="#8b2020" fillOpacity="0.55" stroke="#8b2020" strokeWidth="1" />
      {/* ondas */}
      <g strokeWidth="1.1" opacity="0.7">
        <path d="M-58,18 q8,6 16,0 t16,0" />
        <path d="M18,22 q8,6 16,0 t16,0" />
      </g>
    </g>
  )
}

export function Decorations() {
  return (
    <g aria-hidden="true">
      <SeaSerpent x={302} y={318} scale={1.05} />
      <text
        x="302"
        y="384"
        textAnchor="middle"
        fontFamily="'IM Fell English', serif"
        fontStyle="italic"
        fontSize="15"
        letterSpacing="3"
        fill={INK}
        opacity="0.6"
      >
        Aqui há Monstros
      </text>
      <Galleon x={1300} y={330} scale={1.05} />
      <Galleon x={296} y={646} scale={0.8} flip />
    </g>
  )
}
