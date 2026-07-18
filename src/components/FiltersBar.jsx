import { ALL_ITEMS, LAYER_DEFS, useProgress } from '../store.js'
import { LayerGlyph } from './Glyphs.jsx'

export function FiltersBar() {
  const layers = useProgress((s) => s.layers)
  const completed = useProgress((s) => s.completed)
  const toggleLayer = useProgress((s) => s.toggleLayer)

  return (
    <nav className="filters" aria-label="Filtros de camada">
      {LAYER_DEFS.map((l) => {
        const itens = ALL_ITEMS.filter((m) => m.tipo === l.key)
        const feitos = itens.filter((m) => completed[m.id]).length
        const on = layers[l.key]
        return (
          <button
            key={l.key}
            className={`leather-tag${on ? '' : ' off'}`}
            aria-pressed={on}
            onClick={() => toggleLayer(l.key)}
            title={`${l.nome}: ${feitos}/${itens.length}`}
          >
            <LayerGlyph tipo={l.key} size={17} />
            {l.nome}
            <span className="count">
              {feitos}/{itens.length}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
