import { AnimatePresence, motion } from 'framer-motion'
import { MISSIONS, SEQ_DEFS, useProgress, useUI } from '../store.js'

export function SequencesPanel() {
  const seqOpen = useUI((s) => s.seqOpen)
  const toggleSeq = useUI((s) => s.toggleSeq)
  const setResetOpen = useUI((s) => s.setResetOpen)
  const lantern = useUI((s) => s.lantern)
  const toggleLantern = useUI((s) => s.toggleLantern)
  const completed = useProgress((s) => s.completed)

  return (
    <div className="seq-drawer">
      <AnimatePresence>
        {seqOpen && (
          <motion.div
            className="seq-panel"
            initial={{ x: -290, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -290, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <h2>Sequências</h2>
            {SEQ_DEFS.map((seq) => {
              const missoes = MISSIONS.filter((m) => m.sequencia === seq.key)
              const feitas = missoes.filter((m) => completed[m.id]).length
              const total = missoes.length
              const selada = total > 0 && feitas === total
              return (
                <div className="seq-row" key={seq.key}>
                  <span className="numeral">{seq.numeral}</span>
                  <span className="nome">{seq.nome}</span>
                  <span className="contagem">
                    {feitas}/{total}
                  </span>
                  {selada ? (
                    <span className="lacre-mini" title="Sequência selada" />
                  ) : (
                    <span className="lacre-vazio" />
                  )}
                </div>
              )
            })}
            <div className="seq-footer">
              <div>
                <button className="btn-parchment" onClick={() => setResetOpen(true)}>
                  Queimar as cartas…
                </button>{' '}
                <button
                  className="btn-parchment"
                  onClick={toggleLantern}
                  aria-pressed={lantern}
                  style={{ marginTop: 8 }}
                >
                  {lantern ? 'Apagar a lanterna' : 'Acender a lanterna'}
                </button>
                <p className="nota" style={{ marginTop: 10 }}>
                  O progresso fica gravado apenas neste navegador e aparelho.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button className="seq-handle" onClick={toggleSeq} aria-expanded={seqOpen}>
        SEQUÊNCIAS
      </button>
    </div>
  )
}
