import { useEffect, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'

// Shared noise function so all instances produce the same wave field
const sharedNoise = createNoise2D()

interface Point {
  x: number
  y: number
  wave: { x: number; y: number }
  cursor: { x: number; y: number; vx: number; vy: number }
}

interface WaveBackgroundProps {
  className?: string
  strokeColor?: string
  backgroundColor?: string
}

export default function WaveBackground({
  className = '',
  strokeColor = '#d4d4d4',
  backgroundColor = 'transparent',
}: WaveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const mouseRef = useRef({
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  })
  const pathsRef = useRef<SVGPathElement[]>([])
  const linesRef = useRef<Point[][]>([])
  const rafRef = useRef<number | null>(null)
  const boundingRef = useRef<DOMRect | null>(null)
  const pageOffsetY = useRef(0)

  const visibleRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return
    const container = containerRef.current
    const parent = container.parentElement

    // Only animate when visible on screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
        if (entry.isIntersecting && !rafRef.current) {
          rafRef.current = requestAnimationFrame(tick)
        }
      },
      { threshold: 0 }
    )
    observer.observe(container)

    const setSize = () => {
      if (!containerRef.current || !svgRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const measuredHeight = Math.max(
        rect.height,
        containerRef.current.scrollHeight,
        containerRef.current.offsetHeight,
        parent?.scrollHeight || 0,
        parent?.clientHeight || 0,
        parent?.offsetHeight || 0,
      )
      boundingRef.current = {
        ...rect,
        height: measuredHeight,
        bottom: rect.top + measuredHeight,
      } as DOMRect
      pageOffsetY.current = boundingRef.current.top + window.scrollY
      const { width, height } = boundingRef.current
      svgRef.current.style.width = `${width}px`
      svgRef.current.style.height = `${height}px`
    }

    const setLines = () => {
      if (!svgRef.current || !boundingRef.current) return

      const { width, height } = boundingRef.current
      linesRef.current = []
      pathsRef.current.forEach((path) => path.remove())
      pathsRef.current = []

      const xGap = 8
      const yGap = 8
      // Anchor grid to consistent global positions so sections align
      const xStart = -100 - ((Math.ceil(width / xGap) * xGap - width) / 2)
      const totalLines = Math.ceil((width + 200) / xGap)
      const yStart = -15
      const totalPoints = Math.ceil((height + 30) / yGap)

      for (let i = 0; i < totalLines; i++) {
        const points: Point[] = []
        for (let j = 0; j < totalPoints; j++) {
          points.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          })
        }

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', strokeColor)
        path.setAttribute('stroke-width', '1')
        svgRef.current.appendChild(path)
        pathsRef.current.push(path)
        linesRef.current.push(points)
      }
    }

    const onResize = () => {
      setSize()
      setLines()
    }

    const resizeObserver = new ResizeObserver(() => {
      onResize()
    })

    const updateMousePosition = (clientX: number, clientY: number) => {
      if (!boundingRef.current) return
      // Recalculate bounding rect to account for scroll
      const rect = containerRef.current!.getBoundingClientRect()
      const mouse = mouseRef.current
      mouse.x = clientX - rect.left
      mouse.y = clientY - rect.top

      if (!mouse.set) {
        mouse.sx = mouse.x
        mouse.sy = mouse.y
        mouse.lx = mouse.x
        mouse.ly = mouse.y
        mouse.set = true
      }
    }

    const onMouseMove = (e: MouseEvent) => updateMousePosition(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      updateMousePosition(e.touches[0].clientX, e.touches[0].clientY)
    }

    const movePoints = (time: number) => {
      const lines = linesRef.current
      const mouse = mouseRef.current
      const offsetY = pageOffsetY.current

      lines.forEach((points) => {
        points.forEach((p) => {
          // Use absolute page Y so all sections share the same wave field
          const globalY = p.y + offsetY
          const move =
            sharedNoise((p.x + time * 0.008) * 0.003, (globalY + time * 0.003) * 0.002) * 8

          p.wave.x = Math.cos(move) * 12
          p.wave.y = Math.sin(move) * 6

          const dx = p.x - mouse.sx
          const dy = p.y - mouse.sy
          const d = Math.hypot(dx, dy)
          const l = Math.max(175, mouse.vs)

          if (d < l) {
            const s = 1 - d / l
            const f = Math.cos(d * 0.001) * s
            p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035
            p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035
          }

          p.cursor.vx += (0 - p.cursor.x) * 0.01
          p.cursor.vy += (0 - p.cursor.y) * 0.01
          p.cursor.vx *= 0.95
          p.cursor.vy *= 0.95
          p.cursor.x += p.cursor.vx
          p.cursor.y += p.cursor.vy
          p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x))
          p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y))
        })
      })
    }

    const moved = (point: Point, withCursor = true) => ({
      x: point.x + point.wave.x + (withCursor ? point.cursor.x : 0),
      y: point.y + point.wave.y + (withCursor ? point.cursor.y : 0),
    })

    const drawLines = () => {
      const lines = linesRef.current
      const paths = pathsRef.current

      lines.forEach((points, idx) => {
        if (points.length < 2 || !paths[idx]) return
        const first = moved(points[0], false)
        let d = `M ${first.x} ${first.y}`
        for (let i = 1; i < points.length; i++) {
          const pt = moved(points[i])
          d += `L ${pt.x} ${pt.y}`
        }
        paths[idx].setAttribute('d', d)
      })
    }

    const tick = (time: number) => {
      if (!visibleRef.current) {
        rafRef.current = null
        return
      }

      const mouse = mouseRef.current
      mouse.sx += (mouse.x - mouse.sx) * 0.1
      mouse.sy += (mouse.y - mouse.sy) * 0.1

      const dx = mouse.x - mouse.lx
      const dy = mouse.y - mouse.ly
      mouse.v = Math.hypot(dx, dy)
      mouse.vs += (mouse.v - mouse.vs) * 0.1
      mouse.vs = Math.min(100, mouse.vs)
      mouse.lx = mouse.x
      mouse.ly = mouse.y
      mouse.a = Math.atan2(dy, dx)

      movePoints(time)
      drawLines()
      rafRef.current = requestAnimationFrame(tick)
    }

    setSize()
    setLines()
    rafRef.current = requestAnimationFrame(tick)

    resizeObserver.observe(container)
    if (parent) resizeObserver.observe(parent)
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    container.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      container?.removeEventListener('touchmove', onTouchMove)
      resizeObserver.disconnect()
      observer.disconnect()
    }
  }, [strokeColor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        backgroundColor,
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        className="block w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      />
    </div>
  )
}
