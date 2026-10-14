import { useEffect, useRef, useState } from 'react'

// Shows the bot's LINE picture. When it fails to load (LINE profile image URLs
// go stale after the picture changes) it reports once through onBroken so the
// caller can refresh the profile, and shows the placeholder until a new URL arrives.
export default function BotAvatar({ url, onBroken }) {
  const [failed, setFailed] = useState(false)
  const reported = useRef(false)

  useEffect(() => {
    setFailed(false)
  }, [url])

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        onError={() => {
          setFailed(true)
          if (!reported.current) {
            reported.current = true
            onBroken?.()
          }
        }}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f8ef]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="1.5">
        <path d="M8 10h8M8 14h5M12 2C6.48 2 2 6.48 2 12c0 1.54.35 3 .97 4.29L2 22l5.71-.97C9 21.65 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
      </svg>
    </div>
  )
}
