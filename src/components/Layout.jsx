export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      <main className="flex-1 p-4 space-y-3 safe-bottom">
        {children}
      </main>
    </div>
  )
}
