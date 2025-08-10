'use client'

import { useEffect, useRef, useState } from 'react'

export default function MonteCarlo() {
  const [nTarget, setNTarget] = useState(1000)
  const [n, setN] = useState(0)
  const [inside, setInside] = useState(0)
  const [pi, setPi] = useState(null)
  const [running, setRunning] = useState(false)

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
    </div>
  )
}
