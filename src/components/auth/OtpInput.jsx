'use client'

import { useRef, useState } from 'react'

export default function OtpInput({ length = 6, onChange }) {
  const [values, setValues] = useState(Array(length).fill(''))
  const inputs = useRef([])

  function handleChange(idx, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...values]
    next[idx] = val
    setValues(next)
    onChange?.(next.join(''))
    if (val && idx < length - 1) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace' && !values[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const next = [...values]
    pasted.split('').forEach((c, i) => { next[i] = c })
    setValues(next)
    onChange?.(next.join(''))
    inputs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl
            focus:outline-none focus:border-brand transition-colors"
        />
      ))}
    </div>
  )
}
