import { useState } from 'react'

interface Parcel {
  id: number
  name: string
  location: string
  area: number
  landUse: string
  zoning: string
  assessed: boolean
}

interface Checklist {
  waterSource: boolean
  nativeVegetation: boolean
  soilErosion: boolean
  wildlifeCorridor: boolean
  carbonSequestration: boolean
  communityImpact: boolean
}

const LAND_USE_TYPES = ['Conservation', 'Agriculture', 'Residential', 'Commercial', 'Mixed Use']
const ZONING_CATEGORIES = ['Green Zone', 'Transition Zone', 'Development Zone', 'Protected Area']
const CHECKLIST_ITEMS: { key: keyof Checklist; label: string }[] = [
  { key: 'waterSource', label: 'Water Source Protection' },
  { key: 'nativeVegetation', label: 'Native Vegetation Preservation' },
  { key: 'soilErosion', label: 'Soil Erosion Control' },
  { key: 'wildlifeCorridor', label: 'Wildlife Corridor Access' },
  { key: 'carbonSequestration', label: 'Carbon Sequestration Potential' },
  { key: 'communityImpact', label: 'Community Impact Assessment' },
]

let nextId = 1

export default function App() {
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [search, setSearch] = useState('')

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')
  const [landUse, setLandUse] = useState(LAND_USE_TYPES[0])
  const [zoning, setZoning] = useState(ZONING_CATEGORIES[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [checklists, setChecklists] = useState<Record<number, Checklist>>({})

  const selected = parcels.find((p) => p.id === selectedId) ?? null
  const checklist = selectedId !== null ? checklists[selectedId] ?? {
    waterSource: false,
    nativeVegetation: false,
    soilErosion: false,
    wildlifeCorridor: false,
    carbonSequestration: false,
    communityImpact: false,
  } : null

  const filtered = parcels.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  )

  const totalArea = parcels.reduce((s, p) => s + p.area, 0)
  const assessmentsDone = parcels.filter((p) => p.assessed).length

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Parcel name is required'
    if (!location.trim()) e.location = 'Location is required'
    const areaNum = parseFloat(area)
    if (!area || isNaN(areaNum) || areaNum <= 0) e.area = 'Area must be a positive number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const parcel: Parcel = {
      id: nextId++,
      name: name.trim(),
      location: location.trim(),
      area: parseFloat(area),
      landUse,
      zoning,
      assessed: false,
    }
    setParcels((prev) => [...prev, parcel])
    setName('')
    setLocation('')
    setArea('')
    setLandUse(LAND_USE_TYPES[0])
    setZoning(ZONING_CATEGORIES[0])
    setErrors({})
    setFormOpen(false)
  }

  function handleDelete(id: number) {
    setParcels((prev) => prev.filter((p) => p.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function toggleCheck(key: keyof Checklist) {
    if (selectedId === null) return
    setChecklists((prev) => {
      const cur = prev[selectedId] ?? {
        waterSource: false,
        nativeVegetation: false,
        soilErosion: false,
        wildlifeCorridor: false,
        carbonSequestration: false,
        communityImpact: false,
      }
      const updated = { ...cur, [key]: !cur[key] }
      const allChecked = CHECKLIST_ITEMS.every((item) => updated[item.key])
      if (allChecked && !parcels.find((p) => p.id === selectedId)?.assessed) {
        setParcels((pp) => pp.map((p) => (p.id === selectedId ? { ...p, assessed: true } : p)))
      } else if (!allChecked) {
        setParcels((pp) => pp.map((p) => (p.id === selectedId ? { ...p, assessed: false } : p)))
      }
      return { ...prev, [selectedId]: updated }
    })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-brand-green-700 to-brand-green-500 text-white px-6 py-5 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Land Developer 🏗️</h1>
        <p className="text-brand-green-100 text-sm mt-1">Land Registration & Environmental Impact Analysis</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Parcels Registered" value={parcels.length} />
          <StatCard label="Total Area" value={`${totalArea.toFixed(1)} ha`} />
          <StatCard label="Assessments Completed" value={assessmentsDone} />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setFormOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3 text-left font-semibold text-brand-green-800 hover:bg-brand-green-50 rounded-xl transition-colors"
          >
            <span>Register New Parcel</span>
            <span className={`transform transition-transform ${formOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {formOpen && (
            <form onSubmit={handleSubmit} className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Parcel Name" error={errors.name}>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls(errors.name)} placeholder="e.g. Riverside Plot A" />
              </Field>
              <Field label="Location" error={errors.location}>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls(errors.location)} placeholder="e.g. Kilimani, Nairobi" />
              </Field>
              <Field label="Area (hectares)" error={errors.area}>
                <input type="number" step="0.01" min="0" value={area} onChange={(e) => setArea(e.target.value)} className={inputCls(errors.area)} placeholder="e.g. 2.5" />
              </Field>
              <Field label="Land Use Type">
                <select value={landUse} onChange={(e) => setLandUse(e.target.value)} className={inputCls()}>
                  {LAND_USE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Zoning Category">
                <select value={zoning} onChange={(e) => setZoning(e.target.value)} className={inputCls()}>
                  {ZONING_CATEGORIES.map((z) => <option key={z}>{z}</option>)}
                </select>
              </Field>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
                  Register
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
              <h2 className="font-semibold text-brand-green-800">Parcel Listing</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or location…"
                className="ml-auto max-w-xs w-full text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green-400"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    {['Name', 'Location', 'Area (ha)', 'Land Use', 'Zoning', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No parcels registered yet.</td></tr>
                  )}
                  {filtered.map((p) => (
                    <tr key={p.id} className={`border-t border-slate-100 hover:bg-brand-green-50 transition-colors ${selectedId === p.id ? 'bg-brand-green-100' : ''}`}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.location}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.area.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.landUse}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.zoning}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${p.assessed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {p.assessed ? 'Assessed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 space-x-2">
                        <button onClick={() => setSelectedId(p.id)} className="text-brand-green-600 hover:text-brand-green-800 font-medium text-xs">View</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 font-medium text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            {selected && checklist !== null ? (
              <>
                <h2 className="font-semibold text-brand-green-800 mb-1">Environmental Impact</h2>
                <p className="text-xs text-slate-500 mb-3">{selected.name}</p>
                <div className="space-y-2 mb-4">
                  {CHECKLIST_ITEMS.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={checklist[item.key]}
                        onChange={() => toggleCheck(item.key)}
                        className="accent-brand-green-600 w-4 h-4 rounded border-slate-300"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
                <div className="text-xs text-slate-500">
                  Completion:{' '}
                  <span className="font-semibold text-brand-green-700">
                    {Math.round((CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length / CHECKLIST_ITEMS.length) * 100)}%
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400 text-center py-8">
                Select a parcel to view its environmental impact checklist.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-brand-green-700 mt-1">{value}</p>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

function inputCls(error?: string) {
  return `w-full border ${error ? 'border-red-400' : 'border-slate-300'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400 transition`
}
