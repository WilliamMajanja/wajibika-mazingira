import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type ProjectType = 'reforestation' | 'blue-carbon' | 'conservation' | 'renewable-energy' | 'agroforestry'
type ProjectStatus = 'Active' | 'Planned' | 'Completed'

interface Project {
  id: number
  name: string
  location: string
  type: ProjectType
  area: number
  carbonRate: number
  description: string
  status: ProjectStatus
  lat: number
  lng: number
}

const PROJECT_TYPES: { key: ProjectType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reforestation', label: 'Reforestation' },
  { key: 'blue-carbon', label: 'Blue Carbon' },
  { key: 'conservation', label: 'Conservation' },
  { key: 'renewable-energy', label: 'Renewable Energy' },
  { key: 'agroforestry', label: 'Agroforestry' },
]

const PROJECTS: Project[] = [
  { id: 1, name: 'Jozani Forest Project', location: 'Zanzibar, Tanzania', type: 'reforestation', area: 1250, carbonRate: 4.8, description: 'Restoration of indigenous forest in Jozani-Chwaka Bay National Park, protecting the endemic Zanzibar red colobus monkey habitat.', status: 'Active', lat: -6.27, lng: 39.41 },
  { id: 2, name: 'Pemba Mangroves', location: 'Pemba Island, Tanzania', type: 'blue-carbon', area: 3200, carbonRate: 8.2, description: "Large-scale mangrove restoration along Pemba's coastline, enhancing blue carbon sequestration and coastal resilience.", status: 'Active', lat: -5.07, lng: 39.78 },
  { id: 3, name: 'Mafia Island Coral', location: 'Mafia Island, Tanzania', type: 'conservation', area: 840, carbonRate: 2.1, description: 'Marine protected area management and coral reef restoration in the Mafia Island Marine Park.', status: 'Active', lat: -7.85, lng: 39.66 },
  { id: 4, name: 'Usambara Reforestation', location: 'Usambara Mountains, Tanzania', type: 'reforestation', area: 2100, carbonRate: 5.6, description: "Community-led reforestation in the Eastern Arc Mountains, one of the world's most biodiverse regions.", status: 'Active', lat: -4.78, lng: 38.28 },
  { id: 5, name: 'Rwanda Agroforestry', location: 'Eastern Province, Rwanda', type: 'agroforestry', area: 4500, carbonRate: 3.4, description: "Integrating trees into farming systems across Rwanda's eastern plateau to improve soil health and sequester carbon.", status: 'Active', lat: -1.95, lng: 30.57 },
  { id: 6, name: 'Kenya Rift Solar', location: 'Rift Valley, Kenya', type: 'renewable-energy', area: 1800, carbonRate: 12.5, description: "Solar energy installation offsetting deforestation for charcoal in Kenya's Rift Valley region.", status: 'Planned', lat: -0.50, lng: 36.00 },
  { id: 7, name: 'Ziwa Blue Carbon', location: 'Ziwa, Kenya', type: 'blue-carbon', area: 2800, carbonRate: 7.9, description: 'Mangrove and seagrass restoration along the Kenyan coast, focusing on community-managed carbon credits.', status: 'Active', lat: -2.50, lng: 40.50 },
  { id: 8, name: 'Uganda Forest Corridor', location: 'Kibale, Uganda', type: 'conservation', area: 3600, carbonRate: 4.2, description: 'Creating a wildlife corridor between Kibale and Queen Elizabeth National Parks through forest restoration.', status: 'Active', lat: 0.58, lng: 30.37 },
  { id: 9, name: 'Mikumi Savanna', location: 'Mikumi, Tanzania', type: 'conservation', area: 1500, carbonRate: 1.8, description: 'Savanna ecosystem restoration and wildlife conservation in the Mikumi National Park buffer zone.', status: 'Completed', lat: -7.41, lng: 37.00 },
  { id: 10, name: 'Mt. Kenya Reforestation', location: 'Mount Kenya, Kenya', type: 'reforestation', area: 1900, carbonRate: 5.1, description: 'High-altitude forest restoration on the slopes of Mount Kenya, protecting critical water catchments.', status: 'Planned', lat: -0.15, lng: 37.30 },
]

const TYPE_COLORS: Record<string, string> = {
  reforestation: '#22c55e',
  'blue-carbon': '#3b82f6',
  conservation: '#eab308',
  'renewable-energy': '#f97316',
  agroforestry: '#14b8a6',
}

const TYPE_BADGE: Record<string, string> = {
  reforestation: 'bg-green-100 text-green-800',
  'blue-carbon': 'bg-blue-100 text-blue-800',
  conservation: 'bg-yellow-100 text-yellow-800',
  'renewable-energy': 'bg-orange-100 text-orange-800',
  agroforestry: 'bg-teal-100 text-teal-800',
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Planned: 'bg-amber-100 text-amber-800',
  Completed: 'bg-slate-200 text-slate-600',
}

function formatLabel(type: string): string {
  return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function createColoredIcon(type: ProjectType): L.DivIcon {
  const color = TYPE_COLORS[type] || '#22c55e'
  return L.divIcon({
    className: '',
    html: `<div style="width: 20px; height: 20px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  })
}

function createSelectedIcon(type: ProjectType): L.DivIcon {
  const color = TYPE_COLORS[type] || '#22c55e'
  return L.divIcon({
    className: '',
    html: `<div style="width: 28px; height: 28px; background: ${color}; border: 4px solid #166534; border-radius: 50%; box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

function FitBounds({ projects, selected }: { projects: Project[]; selected: Project | null }) {
  const map = useMap()
  useEffect(() => {
    if (selected) {
      map.setView([selected.lat, selected.lng], 8, { animate: true })
    } else if (projects.length > 0) {
      const bounds = L.latLngBounds(projects.map(p => [p.lat, p.lng] as [number, number]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
    }
  }, [projects, selected, map])
  return null
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState<ProjectType | 'all'>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  const filtered = activeFilter === 'all'
    ? PROJECTS
    : PROJECTS.filter(p => p.type === activeFilter)

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-brand-green-700 via-brand-green-600 to-brand-green-500 text-white px-6 py-8 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Conservation Map 🗺️</h1>
          <p className="mt-1 text-brand-green-100 text-lg">Explore Conservation Projects Across East Africa</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map(pt => (
            <button
              key={pt.key}
              onClick={() => { setActiveFilter(pt.key); setSelectedProject(null) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === pt.key
                  ? 'bg-brand-green-600 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-brand-green-50 border border-slate-200'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </section>

        <section className="flex gap-4 flex-col lg:flex-row">
          <div className="w-full lg:flex-1 h-[550px] rounded-xl border border-slate-300 overflow-hidden shadow-inner z-0">
            <MapContainer
              center={[-1.5, 35.5]}
              zoom={6}
              className="h-full w-full"
              scrollWheelZoom={true}
              ref={mapRef as any}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds projects={filtered} selected={selectedProject} />
              {filtered.map(proj => (
                <Marker
                  key={proj.id}
                  position={[proj.lat, proj.lng]}
                  icon={selectedProject?.id === proj.id ? createSelectedIcon(proj.type) : createColoredIcon(proj.type)}
                  eventHandlers={{
                    click: () => setSelectedProject(proj),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold text-slate-800">{proj.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{proj.location}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[proj.type]}`}>
                          {formatLabel(proj.type)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[proj.status]}`}>
                          {proj.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{proj.area.toLocaleString()} ha · {proj.carbonRate} tCO₂e/ha/yr</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {selectedProject && (
            <aside className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-slate-200 shadow p-5 h-fit">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800">{selectedProject.name}</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[selectedProject.type]}`}>
                  {formatLabel(selectedProject.type)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selectedProject.status]}`}>
                  {selectedProject.status}
                </span>
              </div>

              <p className="text-sm text-slate-500 mb-3">{selectedProject.location}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-brand-green-700">{selectedProject.area.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Hectares</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-brand-green-700">{selectedProject.carbonRate}</p>
                  <p className="text-xs text-slate-500">tCO₂e/ha/yr</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{selectedProject.description}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                Coordinates: {selectedProject.lat.toFixed(4)}, {selectedProject.lng.toFixed(4)}
              </div>
            </aside>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-700">All Projects ({filtered.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map(proj => (
              <button
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className={`w-full flex items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-brand-green-50 ${
                  selectedProject?.id === proj.id ? 'bg-brand-green-50 border-l-4 border-brand-green-600' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full shrink-0`} style={{ backgroundColor: TYPE_COLORS[proj.type] }} />
                <span className="flex-1 font-medium text-sm text-slate-800">{proj.name}</span>
                <span className="text-xs text-slate-400 hidden sm:inline">{proj.location}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[proj.type]}`}>
                  {formatLabel(proj.type)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[proj.status]}`}>
                  {proj.status}
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center text-xs text-slate-400 py-4">
          Wajibika Mazingira — Conservation Map &middot; Data &copy; OpenStreetMap contributors
        </footer>
      </main>
    </div>
  )
}
