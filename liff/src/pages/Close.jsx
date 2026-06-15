import liff from '@line/liff'
import { useEffect } from 'react'

export default function Close() {
  useEffect(() => {
    if (liff.isInClient()) liff.closeWindow()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
      <div className="w-16 h-16 rounded-full bg-[#e8f8ef] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06C755" strokeWidth="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <p className="font-semibold text-gray-700">เสร็จสิ้นแล้ว</p>
      <p className="text-sm text-gray-500">สามารถปิดหน้าต่างนี้ได้</p>
    </div>
  )
}
