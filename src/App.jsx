import { MotionConfig } from 'framer-motion'
import { PaperLayer } from './components/PaperLayer.jsx'
import { MapView } from './components/MapView.jsx'
import { Cartouche, Graticule, LegendBox, ScaleBar } from './components/Furniture.jsx'
import { MissionPanel } from './components/MissionPanel.jsx'
import { FiltersBar } from './components/FiltersBar.jsx'
import { SequencesPanel } from './components/SequencesPanel.jsx'
import { ResetModal } from './components/ResetModal.jsx'
import { Lantern } from './components/Lantern.jsx'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <div className="sheet-shadow-wrap">
          <div className="sheet">
            <PaperLayer />
            <MapView />
            <div className="vignette" aria-hidden="true" />
            <div className="furniture">
              <Cartouche />
              <Graticule />
              <ScaleBar />
              <LegendBox />
            </div>
            <Lantern />
            <SequencesPanel />
            <FiltersBar />
            <MissionPanel />
            <ResetModal />
            <div className="grain" aria-hidden="true" />
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
