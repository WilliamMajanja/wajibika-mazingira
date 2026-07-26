import { useState } from 'react'

type IncidentType = 'Illegal Logging' | 'Pollution' | 'Wildlife Disturbance' | 'Fire' | 'Waste Dumping' | 'Water Contamination' | 'Other'
type Urgency = 'Low' | 'Medium' | 'High' | 'Critical'
type Status = 'Open' | 'Investigating' | 'Resolved'

interface Incident {
  id: string
  type: IncidentType
  location: string
  description: string
  urgency: Urgency
  reporterName: string
  status: Status
  timestamp: Date
}

const INCIDENT_TYPES: IncidentType[] = [
  'Illegal Logging', 'Pollution', 'Wildlife Disturbance',
  'Fire', 'Waste Dumping', 'Water Contamination', 'Other',
]

const URGENCIES: Urgency[] = ['Low', 'Medium', 'High', 'Critical']

const STATUSES: Status[] = ['Open', 'Investigating', 'Resolved']

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function urgencyColor(u: Urgency): string {
  switch (u) {
    case 'Critical': return 'bg-red-100 text-red-800'
    case 'High': return 'bg-orange-100 text-orange-800'
    case 'Medium': return 'bg-yellow-100 text-yellow-800'
    case 'Low': return 'bg-green-100 text-green-800'
  }
}

function statusColor(s: Status): string {
  switch (s) {
    case 'Open': return 'bg-blue-100 text-blue-800'
    case 'Investigating': return 'bg-purple-100 text-purple-800'
    case 'Resolved': return 'bg-green-100 text-green-800'
  }
}

function typeColor(t: IncidentType): string {
  switch (t) {
    case 'Fire': return 'bg-red-100 text-red-800'
    case 'Pollution':
    case 'Water Contamination':
    case 'Waste Dumping': return 'bg-amber-100 text-amber-800'
    case 'Illegal Logging': return 'bg-emerald-100 text-emerald-800'
    case 'Wildlife Disturbance': return 'bg-teal-100 text-teal-800'
    default: return 'bg-slate-100 text-slate-800'
  }
}

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All')
  const [urgencyFilter, setUrgencyFilter] = useState<'All' | Urgency>('All')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [type, setType] = useState<IncidentType>('Other')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('Low')
  const [reporterName, setReporterName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSubmitting(true)
    const incident: Incident = {
      id: crypto.randomUUID(),
      type,
      location: location.trim(),
      description: description.trim(),
      urgency,
      reporterName: reporterName.trim(),
      status: 'Open',
      timestamp: new Date(),
    }
    setIncidents(prev => [incident, ...prev])
    setType('Other')
    setLocation('')
    setDescription('')
    setUrgency('Low')
    setReporterName('')
    setFormOpen(false)
    setSubmitting(false)
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function changeStatus(id: string, status: Status) {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const filtered = incidents.filter(i => {
    if (statusFilter !== 'All' && i.status !== statusFilter) return false
    if (urgencyFilter !== 'All' && i.urgency !== urgencyFilter) return false
    return true
  })

  const total = incidents.length
  const openCount = incidents.filter(i => i.status === 'Open').length
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-brand-green-700 to-brand-green-500 text-white px-6 py-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Community Reporter 📢</h1>
          <p className="text-brand-green-100 mt-1 text-lg">Report & Track Environmental Incidents</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-green-700">{total}</p>
            <p className="text-sm text-slate-500">Total Reports</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{openCount}</p>
            <p className="text-sm text-slate-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-sm text-slate-500">Resolved</p>
          </div>
        </div>

        <button
          onClick={() => setFormOpen(!formOpen)}
          className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
        >
          <span className="text-lg font-semibold text-brand-green-700">
            {formOpen ? '▾ Hide Form' : '▸ Report an Incident'}
          </span>
        </button>

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm p-6 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as IncidentType)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500"
                >
                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as Urgency)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500"
                >
                  {URGENCIES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Karura Forest, Nairobi"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what you observed..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name (optional)</label>
              <input
                type="text"
                value={reporterName}
                onChange={e => setReporterName(e.target.value)}
                placeholder="Anonymous"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand-green-600 hover:bg-brand-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-slate-600 mr-2">Status:</span>
          {(['All', ...STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-sm font-medium text-slate-600 mx-2">Urgency:</span>
          {(['All', ...URGENCIES] as const).map(u => (
            <button
              key={u}
              onClick={() => setUrgencyFilter(u)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                urgencyFilter === u
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 py-12">
              {incidents.length === 0
                ? 'No incidents reported yet. Be the first to report!'
                : 'No incidents match the filters.'}
            </p>
          )}
          {filtered.map(i => {
            const expanded = expandedIds.has(i.id)
            return (
              <div key={i.id} className="bg-white rounded-xl shadow-sm p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColor(i.type)}`}>
                    {i.type}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${urgencyColor(i.urgency)}`}>
                    {i.urgency}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(i.status)}`}>
                    {i.status}
                  </span>
                  {i.location && (
                    <span className="text-sm text-slate-500">📍 {i.location}</span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">{formatDate(i.timestamp)}</span>
                </div>
                <p className={`text-sm text-slate-700 ${expanded ? '' : 'line-clamp-2'}`}>
                  {i.description}
                </p>
                {i.reporterName && (
                  <p className="text-xs text-slate-400">Reported by {i.reporterName}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => toggleExpand(i.id)}
                    className="text-sm text-brand-green-600 hover:text-brand-green-800 font-medium"
                  >
                    {expanded ? 'Show Less' : 'View Details'}
                  </button>
                  {i.status !== 'Investigating' && (
                    <button
                      onClick={() => changeStatus(i.id, 'Investigating')}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Mark Investigating
                    </button>
                  )}
                  {i.status !== 'Resolved' && (
                    <button
                      onClick={() => changeStatus(i.id, 'Resolved')}
                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
