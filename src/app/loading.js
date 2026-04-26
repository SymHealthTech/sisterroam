export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo mark */}
        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center animate-pulse">
          <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="10" r="5" />
            <path d="M8 24c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeWidth="0" />
          </svg>
        </div>
        <div className="space-y-2 w-48">
          <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-2 bg-gray-200 rounded-full animate-pulse w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  )
}
