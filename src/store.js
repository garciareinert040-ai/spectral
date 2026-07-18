import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import missions from './data/missions.json'
import camadas from './data/camadas.json'

export const ALL_ITEMS = [...missions, ...camadas]
export const ITEM_BY_ID = Object.fromEntries(ALL_ITEMS.map((m) => [m.id, m]))
export const MISSIONS = missions
export const CAMADAS = camadas

export const LAYER_DEFS = [
  { key: 'principal', nome: 'História' },
  { key: 'awwg', nome: 'Sem Ouro' },
  { key: 'cacadas', nome: 'Caçadas' },
  { key: 'contratos', nome: 'Contratos' },
  { key: 'lendarios', nome: 'Lendários' },
  { key: 'fortes', nome: 'Fortes' },
  { key: 'oficiais', nome: 'Oficiais' },
]

export const SEQ_DEFS = [
  ...Array.from({ length: 12 }, (_, i) => ({
    key: i + 1,
    nome: `Sequência ${i + 1}`,
    numeral: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i],
  })),
  { key: 'awwg', nome: 'A World Without Gold', numeral: 'AW' },
]

// Ordem cronológica global (AWWG fica entre a Seq. 11 e a 12)
export const chronoKey = (m) => (m.sequencia === 'awwg' ? 11.5 : m.sequencia) * 100 + m.ordem

// Progresso persistido — chave versionada em localStorage
export const useProgress = create(
  persist(
    (set) => ({
      completed: {},
      layers: Object.fromEntries(LAYER_DEFS.map((l) => [l.key, true])),
      toggleCompleted: (id) =>
        set((s) => {
          const completed = { ...s.completed }
          if (completed[id]) delete completed[id]
          else completed[id] = Date.now()
          return { completed }
        }),
      toggleLayer: (key) =>
        set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
      resetAll: () => set({ completed: {} }),
    }),
    { name: 'gralha-progress-v1' }
  )
)

// Estado de interface (não persistido)
export const useUI = create((set) => ({
  selectedId: null,
  seqOpen: false,
  resetOpen: false,
  lantern: false,
  select: (id) => set({ selectedId: id }),
  closePanel: () => set({ selectedId: null }),
  toggleSeq: () => set((s) => ({ seqOpen: !s.seqOpen })),
  setResetOpen: (v) => set({ resetOpen: v }),
  toggleLantern: () => set((s) => ({ lantern: !s.lantern })),
}))
