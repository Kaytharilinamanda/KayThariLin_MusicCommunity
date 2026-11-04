export function AreaChart({ series }) {
  if (!series?.length) return null
  const width = 640
  const height = 220
  const max = Math.max(...series.map((item) => item.value), 1)
  const points = series.map((item, index) => {
    const x = (index / (series.length - 1)) * width
    const y = height - (item.value / max) * (height - 28) - 8
    return [x, y]
  })
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point[0]},${point[1]}`).join(" ")
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Ticket revenue over six months">
      <defs>
        <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b42334" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#b42334" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((row) => (
        <line
          key={row}
          x1="0"
          x2={width}
          y1={(height / 4) * row}
          y2={(height / 4) * row}
          stroke="white"
          strokeOpacity="0.06"
        />
      ))}
      <path d={area} fill="url(#revenue-fill)" />
      <path d={line} fill="none" stroke="#e7a4a8" strokeWidth="3" strokeLinejoin="round" />
      {points.map((point, index) => (
        <circle key={series[index].label} cx={point[0]} cy={point[1]} r="4" fill="#07070b" stroke="#e7a4a8" strokeWidth="2" />
      ))}
    </svg>
  )
}

export function DonutChart({ slices }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const arcs = slices.reduce((items, slice) => {
    const used = items.reduce((sum, item) => sum + item.length, 0)
    const length = (slice.value / total) * circumference
    return [...items, { ...slice, length, offset: used }]
  }, [])

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40" role="img" aria-label="Ticket mix by genre">
      <circle cx="80" cy="80" r={radius} fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="16" />
      {arcs.map((slice) => (
        <circle
          key={slice.label}
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={slice.color}
          strokeWidth="16"
          strokeDasharray={`${Math.max(slice.length - 3, 0)} ${circumference}`}
          strokeDashoffset={-slice.offset}
          transform="rotate(-90 80 80)"
        />
      ))}
      <text x="80" y="76" textAnchor="middle" fill="white" fontSize="18" fontFamily="Outfit, sans-serif">
        {total}
      </text>
      <text x="80" y="94" textAnchor="middle" fill="#a1a1aa" fontSize="10">
        mix
      </text>
    </svg>
  )
}
