// Carta: 1600 × 1000 unidades de mapa.
// Âncoras reais aproximadas: 89.5°O–70.5°O (x) e 27.5°N–15.5°N (y), projeção linear —
// a imprecisão é proposital, como numa carta do séc. XVIII.
export const MAP_W = 1600
export const MAP_H = 1000

export const lonToX = (lonW) => ((89.5 - lonW) / 19) * MAP_W
export const latToY = (lat) => ((27.5 - lat) / 12) * MAP_H

// Converte uma lista de pontos [x,y] numa path SVG suave (Catmull-Rom → Bézier).
// tension menor = curvas mais soltas; closed fecha o contorno.
export function smoothPath(points, closed = false, tension = 1) {
  const pts = points
  const n = pts.length
  if (n < 2) return ''
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2)
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  if (closed) d += 'Z'
  return d
}
