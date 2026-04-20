import Sidebar from './Sidebar'
import TabBar from './TabBar'

export default function AppLayout({ children, user }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <main className="flex-1 pb-20 lg:pb-0">
        {children}
      </main>
      <div className="lg:hidden">
        <TabBar />
      </div>
    </div>
  )
}
