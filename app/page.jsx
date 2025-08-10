'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export default function MonteCarloD3() {
  const svgRef = useRef(null)

  const [nTarget, setNTarget] = useState(1000)
  const [n, setN] = useState(0)
  const [inside, setInside] = useState(0)
  const [pi, setPi] = useState(null)
  const [running, setRunning] = useState(false)

  const width = 600
  const height = 600
  const margin = 40
  const plotSize = Math.min(width, height) - margin * 2
  const cx = width / 2
  const cy = height / 2
  const r = plotSize / 2

  const xScale = d3.scaleLinear().domain([-1, 1]).range([cx - r, cx + r])
  const yScale = d3.scaleLinear().domain([-1, 1]).range([cy + r, cy - r])

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')

    svg.selectAll('*').remove()

    svg.append('rect')
      .attr('x', cx - r).attr('y', cy - r)
      .attr('width', plotSize).attr('height', plotSize)
      .attr('fill', '#fff')
      .attr('stroke', '#999')

    svg.append('line')
      .attr('x1', xScale(-1)).attr('y1', yScale(0))
      .attr('x2', xScale(1)).attr('y2', yScale(0))
      .attr('stroke', '#777').attr('stroke-dasharray', '4,4')

    svg.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(-1))
      .attr('x2', xScale(0)).attr('y2', yScale(1))
      .attr('stroke', '#777').attr('stroke-dasharray', '4,4')

    svg.append('circle')
      .attr('cx', cx).attr('cy', cy).attr('r', r)
      .attr('fill', 'none').attr('stroke', '#bbb').attr('stroke-width', 4)

    svg.append('g').attr('id', 'points')
  }, [])

  useEffect(() => {
    if (!running) return
    let frameId
    const batch = 250

    const step = () => {
      const remaining = nTarget - n
      if (remaining <= 0) {
        setRunning(false)
        return
      }

      let inCircle = 0
      const add = Math.min(batch, remaining)

      for (let i = 0; i < add; i++) {
        const x = Math.random() * 2 - 1
        const y = Math.random() * 2 - 1
        if (x * x + y * y <= 1) inCircle++
      }

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
  }, [running, n, inside, nTarget])

  const reset = () => {
    setN(0)
    setInside(0)
    setPi(null)
    setRunning(false)
  }

  return (
    <div className='mx-auto max-w-4xl p-6 space-y-4'>
      <h1 className='text-2xl font-bold'>Monte Carlo π con D3.js</h1>

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
