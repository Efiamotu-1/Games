import { useEffect, useRef, useState } from 'react'

interface ModeInfoButtonProps {
  title: string
  description: string
}

/**
 * Tap-to-toggle info popover (not hover-based) so it works identically on
 * touch and desktop. Explains a mode in plain language so a room doesn't
 * depend on the host being present to narrate what each toggle does.
 */
export default function ModeInfoButton({ title, description }: ModeInfoButtonProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label={`What is ${title}?`}
        className="w-4 h-4 rounded-full border border-neutral-600 text-neutral-500 text-[10px] leading-none flex items-center justify-center hover:border-violet-400 hover:text-violet-300 transition-colors shrink-0"
      >
        i
      </button>
      {open && (
        <div
          className="absolute z-20 top-full mt-1.5 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl text-left animate-pop-in"
          style={{ left: '50%', transform: 'translateX(-50%)', right: 'auto' }}
          ref={(el) => {
            if (!el) return
            const rect = el.getBoundingClientRect()
            const margin = 16
            if (rect.left < margin) {
              el.style.left = `${margin}px`
              el.style.transform = 'translateX(0)'
            } else if (rect.right > window.innerWidth - margin) {
              el.style.left = 'auto'
              el.style.right = '0px'
              el.style.transform = 'translateX(0)'
            }
          }}
        >
          <p className="text-xs font-semibold text-neutral-200 mb-1">{title}</p>
          <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  )
}
