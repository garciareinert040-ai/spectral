import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ITEM_BY_ID, SEQ_DEFS, useProgress, useUI } from '../store.js'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.18 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

function metaLabel(m) {
  if (m.tipo === 'principal') {
    const seq = SEQ_DEFS.find((s) => s.key === m.sequencia)
    return `${seq ? seq.nome : `Sequência ${m.sequencia}`} · Memória ${m.ordem}`
  }
  if (m.tipo === 'awwg') return `A World Without Gold · Memória ${m.ordem}`
  const nomes = {
    cacadas: 'Caçada Templária',
    contratos: 'Contratos',
    lendarios: 'Navio Lendário',
    fortes: 'Forte Naval',
    oficiais: 'Missão de Oficial',
  }
  return nomes[m.tipo] ?? ''
}

export function MissionPanel() {
  const selectedId = useUI((s) => s.selectedId)
  const close = useUI((s) => s.closePanel)
  const completed = useProgress((s) => s.completed)
  const toggleCompleted = useProgress((s) => s.toggleCompleted)
  const [revealed, setRevealed] = useState(false)

  const m = selectedId ? ITEM_BY_ID[selectedId] : null
  const done = m ? !!completed[m.id] : false
  const hasTodo = m ? `${m.nome} ${m.resumoJogo}`.includes('TODO') : false

  useEffect(() => setRevealed(false), [selectedId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <AnimatePresence>
      {m && (
        <motion.aside
          className="mission-panel"
          key={m.id}
          initial={{ scaleY: 0.04, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          exit={{ scaleY: 0.04, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1.1, 0.36, 1] }}
          aria-label={`Detalhes de ${m.nome}`}
        >
          <button className="panel-close" onClick={close} aria-label="Fechar painel">
            ✕
          </button>
          <div className="panel-paper">
            <motion.div variants={container} initial="hidden" animate="show">
              <motion.p className="meta" variants={item}>{metaLabel(m)}</motion.p>
              <motion.h2 variants={item}>{m.nome}</motion.h2>
              <motion.p className="local" variants={item}>⚓ {m.local}</motion.p>
              <motion.div className="rule" variants={item} />

              {hasTodo && (
                <motion.div variants={item}>
                  <span className="todo-flag">carta incompleta — preencher TODO</span>
                </motion.div>
              )}

              <motion.div variants={item}>
                <h3>Diário de bordo</h3>
                <div className={`spoiler-box${revealed ? '' : ' hidden'}`}>
                  <p className="texto" aria-hidden={!revealed}>{m.resumoJogo}</p>
                  {!revealed && (
                    <div className="revelar">
                      <button onClick={() => setRevealed(true)}>Revelar spoilers</button>
                    </div>
                  )}
                </div>
              </motion.div>

              {m.contextoHistorico && (
                <motion.div className="historia-card" variants={item}>
                  <h3>O que aconteceu de verdade</h3>
                  <p>{m.contextoHistorico}</p>
                </motion.div>
              )}

              <motion.div className="panel-actions" variants={item}>
                {done ? (
                  <>
                    <button className="btn-parchment" onClick={() => toggleCompleted(m.id)}>
                      Desfazer conclusão
                    </button>
                    <span className="action-label">Selada como concluída.</span>
                  </>
                ) : (
                  <>
                    <button
                      className="wax"
                      onClick={() => toggleCompleted(m.id)}
                      aria-label="Marcar como concluída"
                    >
                      <span>✓</span>
                    </button>
                    <span className="action-label">Selar como concluída</span>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
