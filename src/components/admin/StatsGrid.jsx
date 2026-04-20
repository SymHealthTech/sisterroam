export default function StatsGrid({ stats }) {
  const cards = [
    { label: 'Total Users', value: stats?.users ?? '—', color: 'brand' },
    { label: 'Active Hosts', value: stats?.hosts ?? '—', color: 'teal' },
    { label: 'KYC Pending', value: stats?.kycPending ?? '—', color: 'amber' },
    { label: 'Open Reports', value: stats?.openReports ?? '—', color: 'danger' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-3xl font-bold text-${color}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}
