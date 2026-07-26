import { useState, useCallback } from 'react'

type TxType = 'send' | 'receive'
type TxStatus = 'Completed' | 'Pending' | 'Failed'

interface Transaction {
  id: number
  type: TxType
  counterparty: string
  amount: number
  date: string
  status: TxStatus
  project?: string
  memo?: string
}

interface Balances {
  total: number
  available: number
  escrow: number
  retired: number
}

const PROJECTS = [
  'Mikoko Mangrove Restoration',
  'Tana River Reforestation',
  'Rift Valley Solar Farm',
  'Mt. Kenya Biogas Initiative',
]

const seedTransactions: Transaction[] = [
  { id: 1, type: 'receive', counterparty: 'Green Carbon Corp', amount: 500, date: '2026-06-20', status: 'Completed', project: 'Mikoko Mangrove Restoration' },
  { id: 2, type: 'send', counterparty: 'EcoTravel Ltd', amount: 50, date: '2026-06-18', status: 'Completed', project: 'Tana River Reforestation' },
  { id: 3, type: 'receive', counterparty: 'Carbon Offset Fund', amount: 200, date: '2026-06-15', status: 'Pending', project: 'Rift Valley Solar Farm' },
  { id: 4, type: 'send', counterparty: 'Green Freight Inc', amount: 120, date: '2026-06-12', status: 'Completed', project: 'Mt. Kenya Biogas Initiative' },
  { id: 5, type: 'send', counterparty: 'SustainaFlight', amount: 75, date: '2026-06-10', status: 'Failed', project: 'Mikoko Mangrove Restoration' },
  { id: 6, type: 'receive', counterparty: 'World Bank Carbon Fund', amount: 1000, date: '2026-06-05', status: 'Completed', memo: 'Q2 retroactive issuance' },
]

function randomizeBalances(base: Balances): Balances {
  const f = () => Math.round((Math.random() - 0.3) * 50)
  const available = Math.max(0, base.available + f())
  const escrow = Math.max(0, base.escrow + f())
  const retired = Math.max(0, base.retired + Math.round(Math.random() * 5))
  return { available, escrow, retired, total: available + escrow + retired }
}

function StatusBadge({ status }: { status: TxStatus }) {
  const map: Record<TxStatus, string> = {
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Failed: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}

export default function App() {
  const [balances, setBalances] = useState<Balances>({
    total: 1247,
    available: 892,
    escrow: 310,
    retired: 45,
  })

  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions)

  const [showSend, setShowSend] = useState(false)
  const [sendForm, setSendForm] = useState({ recipient: '', amount: '', project: PROJECTS[0], memo: '' })

  const [showRequest, setShowRequest] = useState(false)
  const [requestForm, setRequestForm] = useState({ from: '', amount: '', reason: '' })

  const nextId = useCallback(() => Math.max(...transactions.map(t => t.id), 0) + 1, [transactions])

  const handleRefresh = () => setBalances(randomizeBalances)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(sendForm.amount)
    if (!sendForm.recipient || !amount || amount <= 0) return
    if (amount > balances.available) { alert('Insufficient available balance'); return }

    const tx: Transaction = {
      id: nextId(),
      type: 'send',
      counterparty: sendForm.recipient,
      amount,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      project: sendForm.project,
      memo: sendForm.memo || undefined,
    }
    setTransactions(prev => [tx, ...prev])
    setBalances(prev => ({
      ...prev,
      available: Math.round((prev.available - amount) * 100) / 100,
      total: Math.round((prev.total - amount) * 100) / 100,
    }))
    setSendForm({ recipient: '', amount: '', project: PROJECTS[0], memo: '' })
    setShowSend(false)
  }

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(requestForm.amount)
    if (!requestForm.from || !amount || amount <= 0) return

    const tx: Transaction = {
      id: nextId(),
      type: 'receive',
      counterparty: requestForm.from,
      amount,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      memo: requestForm.reason || undefined,
    }
    setTransactions(prev => [tx, ...prev])
    setRequestForm({ from: '', amount: '', reason: '' })
    setShowRequest(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      {/* Header */}
      <header className="bg-gradient-to-r from-brand-green-700 to-brand-green-500 text-white px-4 py-6 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Carbon Wallet <span role="img" aria-label="card">💳</span>
          </h1>
          <p className="text-brand-green-100 text-sm mt-0.5">Manage Your Carbon Credits</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-4 mt-5">
        {/* Balance Card */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Credit Balance</p>
              <p className="text-4xl font-bold text-brand-green-700 mt-1">
                {balances.total.toLocaleString()} <span className="text-xl">tCO₂</span>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100 border border-brand-green-200 rounded-lg px-3 py-1.5 font-medium transition"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div>
              <span className="text-slate-400">Available</span>
              <p className="font-semibold text-slate-700">{balances.available.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400">In Escrow</span>
              <p className="font-semibold text-slate-700">{balances.escrow.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400">Retired</span>
              <p className="font-semibold text-slate-700">{balances.retired.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          {/* Send */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => { setShowSend(v => !v); setShowRequest(false) }}
              className="w-full px-4 py-3.5 font-semibold text-left flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">↑</span>
              Send Credits
            </button>
            {showSend && (
              <form onSubmit={handleSend} className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                <input
                  required
                  placeholder="Recipient"
                  value={sendForm.recipient}
                  onChange={e => setSendForm(f => ({ ...f, recipient: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400"
                />
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount (tCO₂)"
                  value={sendForm.amount}
                  onChange={e => setSendForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400"
                />
                <select
                  value={sendForm.project}
                  onChange={e => setSendForm(f => ({ ...f, project: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400"
                >
                  {PROJECTS.map(p => <option key={p}>{p}</option>)}
                </select>
                <input
                  placeholder="Memo (optional)"
                  value={sendForm.memo}
                  onChange={e => setSendForm(f => ({ ...f, memo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400"
                />
                <button
                  type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg py-2 text-sm transition"
                >
                  Send
                </button>
              </form>
            )}
          </div>

          {/* Request */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => { setShowRequest(v => !v); setShowSend(false) }}
              className="w-full px-4 py-3.5 font-semibold text-left flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">↓</span>
              Request Credits
            </button>
            {showRequest && (
              <form onSubmit={handleRequest} className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                <input
                  required
                  placeholder="From"
                  value={requestForm.from}
                  onChange={e => setRequestForm(f => ({ ...f, from: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400"
                />
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount (tCO₂)"
                  value={requestForm.amount}
                  onChange={e => setRequestForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400"
                />
                <textarea
                  placeholder="Reason"
                  rows={2}
                  value={requestForm.reason}
                  onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400 resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-medium rounded-lg py-2 text-sm transition"
                >
                  Request
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Transaction History */}
        <section className="bg-white rounded-2xl shadow">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Transaction History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No transactions yet.</p>
            )}
            {transactions.map(tx => (
              <div key={tx.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  tx.type === 'receive' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {tx.type === 'receive' ? '↓' : '↑'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{tx.counterparty}</p>
                  <p className="text-xs text-slate-400">
                    {tx.date}
                    {tx.project && <span> · {tx.project}</span>}
                    {tx.memo && <span> · {tx.memo}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.type === 'receive' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount.toLocaleString()}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
