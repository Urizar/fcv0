'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

/**
 * Componente React que estima π con Monte Carlo y dibuja los puntos con D3
 * Idea: la probabilidad de caer dentro del círculo unidad en el cuadrado [-1,1]^2 es π/4
 * Por tanto, π ≈ 4 * (dentro / total)
 */
export default function MonteCarloD3() {
  /** Referencia al SVG para dibujar con D3 */
  const svgRef = useRef(null)

  /** Muestras objetivo totales por generar */
  const [nTarget, setNTarget] = useState(1000)
  /** Muestras ya generadas */
  const [n, setN] = useState(0)
  /** Conteo de puntos que cayeron dentro del círculo */
  const [inside, setInside] = useState(0)
  /** Estimación numérica de π */
  const [pi, setPi] = useState(null)
  /** Bandera que indica si la simulación está corriendo */
  const [running, setRunning] = useState(false)

  // Configuración de lienzo
  const width = 600
  const height = 600
  const margin = 40
  const plotSize = Math.min(width, height) - margin * 2
  const cx = width / 2
  const cy = height / 2
  const r = plotSize / 2

  /**
   * Escala lineal X: [-1, 1] a pixeles
   * @type {d3.ScaleLinear<number, number>}
   */
  const xScale = d3.scaleLinear().domain([-1, 1]).range([cx - r, cx + r])

  /**
   * Escala lineal Y invertida para SVG
   * @type {d3.ScaleLinear<number, number>}
   */
  const yScale = d3.scaleLinear().domain([-1, 1]).range([cy + r, cy - r])

  /** Generador uniforme en [-1,1] usando D3 */
  const rand = d3.randomUniform(-1, 1)

  /**
   * Inicializa el lienzo y elementos estáticos al montar
   */
  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')

    svg.selectAll('*').remove()

    // Fondo: cuadrado circunscrito
    svg.append('rect')
      .attr('x', cx - r).attr('y', cy - r)
      .attr('width', plotSize).attr('height', plotSize)
      .attr('fill', '#fff')
      .attr('stroke', '#999')

    // Eje X
    svg.append('line')
      .attr('x1', xScale(-1)).attr('y1', yScale(0))
      .attr('x2', xScale(1)).attr('y2', yScale(0))
      .attr('stroke', '#777')
      .attr('stroke-dasharray', '4,4')

    // Eje Y
    svg.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(-1))
      .attr('x2', xScale(0)).attr('y2', yScale(1))
      .attr('stroke', '#777')
      .attr('stroke-dasharray', '4,4')

    // Círculo unidad
    svg.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', r)
      .attr('fill', 'none')
      .attr('stroke', '#bbb')
      .attr('stroke-width', 4)

    // Capa para puntos
    svg.append('g').attr('id', 'points')
  }, [])

  /**
   * Bucle animado: genera puntos en lotes, dibuja y actualiza π
   */
  useEffect(() => {
    if (!running) return

    const svg = d3.select(svgRef.current)
    const pointsG = svg.select('#points')

    let frameId
    const batch = 250

    /**
     * Genera un frame de la simulación
     */
    const step = () => {
      const remaining = nTarget - n
      if (remaining <= 0) {
        setRunning(false)
        return
      }

      let inCircle = 0
      const add = Math.min(batch, remaining)
      const pts = []

      for (let i = 0; i < add; i++) {
        const x = rand()
        const y = rand()
        const isInside = x * x + y * y <= 1
        if (isInside) inCircle++
        pts.push({ x, y, inside: isInside })
      }

      pointsG.selectAll(null)
        .data(pts)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 3.2)
        .attr('fill', d => d.inside ? '#7678ed' : '#f7b801')
        .attr('opacity', 0.85)

      const newN = n + add
      const newInside = inside + inCircle
      setN(newN)
      setInside(newInside)
      setPi(4 * (newInside / newN))

      if (newN >= nTarget) {
        setRunning(false)
        return
      }
      frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [running, n, inside, nTarget, rand])

  /**
   * Reinicia contadores y limpia los puntos del gráfico
   */
  const reset = () => {
    setN(0)
    setInside(0)
    setPi(null)
    setRunning(false)
    d3.select(svgRef.current).select('#points').selectAll('*').remove()
  }

  return (
    <div className='mx-auto max-w-4xl p-6 space-y-4'>
      <h1 className='text-2xl font-bold'>Monte Carlo π</h1>

      <div className='flex flex-wrap items-end gap-3'>
        <label className='block'>
          <span className='text-sm font-medium'>Muestras objetivo</span>
          <input
            type='number'
            min='1'
            step='1'
            value={nTarget}
            onChange={e => setNTarget(Number(e.target.value))}
            className='mt-1 w-40 rounded border p-2'
          />
        </label>

        <button
          onClick={() => { reset(); setRunning(true) }}
          disabled={running || nTarget < 1}
          className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
        >
          {running ? 'Corriendo…' : 'Iniciar'}
        </button>

        <button
          onClick={() => setRunning(false)}
          disabled={!running}
          className='rounded border px-4 py-2'
        >
          Pausar
        </button>

        <button
          onClick={reset}
          className='rounded border px-4 py-2'
        >
          Limpiar
        </button>
      </div>

      <div className='text-sm text-gray-700'>
        <div><strong>Samples:</strong> {n} / {nTarget}</div>
        <div><strong>Dentro del círculo:</strong> {inside}</div>
        <div>
          <strong>π ≈</strong> {pi ? pi.toFixed(6) : '—'}&nbsp;
          {pi && <span className='text-gray-500'>(error abs: {(Math.abs(Math.PI - pi)).toExponential(2)})</span>}
        </div>
      </div>

      <svg
        ref={svgRef}
        style={{ width: '100%', maxWidth: 500, aspectRatio: '1 / 1', borderRadius: 8, boxShadow: '0 0 0 1px #e5e7eb' }}
      />
    </div>
  )
}
