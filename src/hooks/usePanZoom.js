import { useEffect } from 'react'
import { MAP_W, MAP_H } from '../geo/projection.js'

// Pan/zoom a 60fps: o transform é aplicado direto no atributo do <g> via rAF,
// sem re-render do React. Limitado às bordas da carta; roda + arrastar + pinça.
export function usePanZoom(viewportRef, contentRef) {
  useEffect(() => {
    const vp = viewportRef.current
    const el = contentRef.current
    if (!vp || !el) return

    let vw = vp.clientWidth
    let vh = vp.clientHeight
    let s0 = Math.max(vw / MAP_W, vh / MAP_H)
    const state = { x: 0, y: 0, s: s0 }
    const MAX_ZOOM = 4.5

    const clamp = () => {
      state.s = Math.min(Math.max(state.s, s0), s0 * MAX_ZOOM)
      state.x = Math.min(0, Math.max(vw - MAP_W * state.s, state.x))
      state.y = Math.min(0, Math.max(vh - MAP_H * state.s, state.y))
    }

    let raf = 0
    const apply = () => {
      raf = 0
      el.setAttribute(
        'transform',
        `translate(${state.x.toFixed(2)} ${state.y.toFixed(2)}) scale(${state.s.toFixed(4)})`
      )
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }

    state.x = (vw - MAP_W * state.s) / 2
    state.y = (vh - MAP_H * state.s) / 2
    clamp()
    apply()

    const zoomAt = (cx, cy, f) => {
      const rect = vp.getBoundingClientRect()
      const px = cx - rect.left
      const py = cy - rect.top
      const ns = Math.min(Math.max(state.s * f, s0), s0 * MAX_ZOOM)
      const rf = ns / state.s
      state.x = px - (px - state.x) * rf
      state.y = py - (py - state.y) * rf
      state.s = ns
      clamp()
      schedule()
    }

    const onResize = () => {
      vw = vp.clientWidth
      vh = vp.clientHeight
      s0 = Math.max(vw / MAP_W, vh / MAP_H)
      clamp()
      schedule()
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(vp)

    const pointers = new Map()
    let lastDist = 0
    let moved = false

    const onDown = (e) => {
      // NÃO captura o ponteiro aqui: capturar no pointerdown redirecionaria o
      // click seguinte para o viewport e os pins nunca receberiam o evento.
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        lastDist = Math.hypot(a.x - b.x, a.y - b.y)
        for (const id of pointers.keys()) {
          try { vp.setPointerCapture(id) } catch { /* ok */ }
        }
      }
      if (pointers.size === 1) moved = false
    }

    const onMove = (e) => {
      const p = pointers.get(e.pointerId)
      if (!p) return
      if (pointers.size === 1) {
        const dx = e.clientX - p.x
        const dy = e.clientY - p.y
        if (!moved && Math.abs(dx) + Math.abs(dy) > 3) {
          moved = true
          // só agora vale a pena prender o ponteiro (arrasto de verdade)
          try { vp.setPointerCapture(e.pointerId) } catch { /* ok */ }
        }
        state.x += dx
        state.y += dy
        p.x = e.clientX
        p.y = e.clientY
        clamp()
        schedule()
      } else if (pointers.size === 2) {
        p.x = e.clientX
        p.y = e.clientY
        const [a, b] = [...pointers.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (lastDist > 0 && dist > 0) {
          zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / lastDist)
        }
        lastDist = dist
        moved = true
      }
    }

    const onUp = (e) => {
      pointers.delete(e.pointerId)
      lastDist = 0
    }

    const onWheel = (e) => {
      e.preventDefault()
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016))
    }

    // Depois de arrastar, engole o click para não abrir/fechar painéis sem querer
    const onClickCapture = (e) => {
      if (moved) {
        e.stopPropagation()
        e.preventDefault()
        moved = false
      }
    }

    vp.addEventListener('pointerdown', onDown)
    vp.addEventListener('pointermove', onMove)
    vp.addEventListener('pointerup', onUp)
    vp.addEventListener('pointercancel', onUp)
    vp.addEventListener('wheel', onWheel, { passive: false })
    vp.addEventListener('click', onClickCapture, true)

    return () => {
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
      vp.removeEventListener('pointerdown', onDown)
      vp.removeEventListener('pointermove', onMove)
      vp.removeEventListener('pointerup', onUp)
      vp.removeEventListener('pointercancel', onUp)
      vp.removeEventListener('wheel', onWheel)
      vp.removeEventListener('click', onClickCapture, true)
    }
  }, [viewportRef, contentRef])
}
