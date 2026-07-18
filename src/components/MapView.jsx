import { useRef } from 'react'
import { usePanZoom } from '../hooks/usePanZoom.js'
import { useUI } from '../store.js'
import { Geography } from './Geography.jsx'
import { Decorations } from './Decorations.jsx'
import { CompassRose } from './CompassRose.jsx'
import { RouteJackdaw } from './RouteJackdaw.jsx'
import { Pins } from './Pins.jsx'

export function MapView() {
  const vpRef = useRef(null)
  const gRef = useRef(null)
  const closePanel = useUI((s) => s.closePanel)
  usePanZoom(vpRef, gRef)

  return (
    <div
      className="map-viewport"
      ref={vpRef}
      role="application"
      aria-label="Carta náutica interativa do Mar das Caraíbas"
      onClick={(e) => {
        // clique no mar (fora de qualquer pin) fecha o painel
        if (!(e.target instanceof Element) || !e.target.closest('.pin')) closePanel()
      }}
    >
      <svg>
        <g ref={gRef} className="map-content">
          <Geography />
          <Decorations />
          <CompassRose x={520} y={790} scale={1} />
          <CompassRose x={1268} y={178} scale={0.42} simple />
          <RouteJackdaw />
          <Pins />
        </g>
      </svg>
    </div>
  )
}
