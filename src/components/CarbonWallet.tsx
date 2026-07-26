import * as React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { CarbonCredit, MarketOrder } from '../types';

interface WalletTransaction {
  id: string;
  type: 'send' | 'receive';
  counterparty: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  project?: string;
  memo?: string;
  orderId?: string;
}

function StatusBadge({ status }: { status: WalletTransaction['status'] }) {
  const map: Record<WalletTransaction['status'], string> = {
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

export function CarbonWallet() {
  const { addToast } = useToasts();
  const [projects] = useLocalStorage<{ id: string; name: string }[]>('carbonProjects', []);
  const [credits] = useLocalStorage<CarbonCredit[]>('carbonCredits', []);
  const [orders] = useLocalStorage<MarketOrder[]>('marketOrders', []);
  const [transactions, setTransactions] = useLocalStorage<WalletTransaction[]>('carbonTransactions', []);
  const [portfolio] = useLocalStorage<{ totalRetired: number }>('carbonPortfolio', { totalRetired: 0 });

  const [showSend, setShowSend] = useLocalStorage('walletShowSend', false);
  const [showRequest, setShowRequest] = useLocalStorage('walletShowRequest', false);
  const [sendForm, setSendForm] = useLocalStorage('walletSendForm', { recipient: '', amount: '', memo: '' });
  const [requestForm, setRequestForm] = useLocalStorage('walletRequestForm', { from: '', amount: '', reason: '' });

  const availableCredits = credits
    .filter(c => c.status === 'available' || c.status === 'listed')
    .reduce((s, c) => s + c.tonnesCO2, 0);
  const escrowCredits = credits
    .filter(c => c.status === 'pending_verification')
    .reduce((s, c) => s + c.tonnesCO2, 0);
  const retiredCredits = portfolio.totalRetired;

  const totalOrders = orders
    .filter(o => o.status === 'open' || o.status === 'partial')
    .reduce((s, o) => s + (o.tonnes - o.filledTonnes), 0);

  const pendingAmount = transactions
    .filter(tx => tx.status === 'Pending')
    .reduce((s, tx) => s + tx.amount, 0);

  const balanceTotal = availableCredits + escrowCredits + totalOrders + retiredCredits + pendingAmount;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(sendForm.amount);
    if (!sendForm.recipient || !amount || amount <= 0) return;
    if (amount > availableCredits) { addToast({ type: 'error', message: 'Insufficient available balance' }); return; }

    const tx: WalletTransaction = {
      id: `WLTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: 'send',
      counterparty: sendForm.recipient,
      amount,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      memo: sendForm.memo || undefined,
    };
    setTransactions(prev => [tx, ...prev]);
    setSendForm({ recipient: '', amount: '', memo: '' });
    setShowSend(false);
    addToast({ type: 'success', message: `${amount} tCO₂ sent to ${sendForm.recipient}` });
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(requestForm.amount);
    if (!requestForm.from || !amount || amount <= 0) return;

    const tx: WalletTransaction = {
      id: `WLTX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: 'receive',
      counterparty: requestForm.from,
      amount,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      memo: requestForm.reason || undefined,
    };
    setTransactions(prev => [tx, ...prev]);
    setRequestForm({ from: '', amount: '', reason: '' });
    setShowRequest(false);
    addToast({ type: 'success', message: `Requested ${amount} tCO₂ from ${requestForm.from}` });
  };

  return (
    <div className="min-h-[100dvh] bg-slate-100 pb-10">
      <div className="max-w-lg mx-auto space-y-4">
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Credit Balance</p>
              <p className="text-4xl font-bold text-brand-green-700 mt-1">
                {Math.round(balanceTotal).toLocaleString()} <span className="text-xl">tCO₂</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-2.5">
              <span className="text-slate-400 text-xs">Available</span>
              <p className="font-semibold text-slate-700">{Math.round(availableCredits).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <span className="text-slate-400 text-xs">In Orders</span>
              <p className="font-semibold text-slate-700">{Math.round(totalOrders).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <span className="text-slate-400 text-xs">Pending</span>
              <p className="font-semibold text-slate-700">{Math.round(pendingAmount).toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <span className="text-slate-400 text-xs">Retired</span>
              <p className="font-semibold text-slate-700">{Math.round(retiredCredits).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Balances derived from <strong>{credits.length}</strong> credits across <strong>{projects.length}</strong> projects
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => { setShowSend(v => !v); setShowRequest(false); }}
              className="w-full px-4 py-3.5 font-semibold text-left flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">↑</span>
              Send Credits
            </button>
            {showSend && (
              <form onSubmit={handleSend} className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                <input required placeholder="Recipient" value={sendForm.recipient} onChange={e => setSendForm(f => ({ ...f, recipient: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400" />
                <input required type="number" min="0.01" step="0.01" placeholder="Amount (tCO₂)" value={sendForm.amount} onChange={e => setSendForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400" />
                <input placeholder="Memo (optional)" value={sendForm.memo} onChange={e => setSendForm(f => ({ ...f, memo: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400" />
                <button type="submit"
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg py-2 text-sm transition"
                  disabled={parseFloat(sendForm.amount) > availableCredits}>
                  Send {sendForm.amount ? `(${parseFloat(sendForm.amount).toLocaleString()} tCO₂)` : ''}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <button
              onClick={() => { setShowRequest(v => !v); setShowSend(false); }}
              className="w-full px-4 py-3.5 font-semibold text-left flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">↓</span>
              Request Credits
            </button>
            {showRequest && (
              <form onSubmit={handleRequest} className="px-4 pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                <input required placeholder="From" value={requestForm.from} onChange={e => setRequestForm(f => ({ ...f, from: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400" />
                <input required type="number" min="0.01" step="0.01" placeholder="Amount (tCO₂)" value={requestForm.amount} onChange={e => setRequestForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400" />
                <textarea placeholder="Reason" rows={2} value={requestForm.reason} onChange={e => setRequestForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-400 resize-none" />
                <button type="submit"
                  className="w-full bg-brand-green-600 hover:bg-brand-green-700 text-white font-medium rounded-lg py-2 text-sm transition">
                  Request
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Transaction History</h2>
            <span className="text-xs text-slate-400">{transactions.length} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.length === 0 && (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">
                No transactions yet. Credits appear here when you trade in the{' '}
                <a href="#market" className="text-brand-green-600 hover:underline font-medium">Carbon Market</a>
                {' '}or use Send/Request above.
              </p>
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
                    {tx.orderId && <span> · Order {tx.orderId}</span>}
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

        <section className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Credit Portfolio</h2>
          {credits.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              No credits yet. Activate a project in{' '}
              <a href="#carbon" className="text-brand-green-600 hover:underline font-medium">Carbon Dashboard</a>.
            </p>
          ) : (
            <div className="space-y-2">
              {credits.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 truncate font-medium">{c.projectName}</p>
                    <p className="text-xs text-slate-400">{c.serialNumber} · {c.vintage}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-semibold text-slate-700">{c.tonnesCO2} tCO2</p>
                    <span className={`text-xs font-medium ${
                      c.status === 'available' ? 'text-green-600' :
                      c.status === 'listed' ? 'text-blue-600' :
                      c.status === 'retired' ? 'text-slate-400' : 'text-yellow-600'
                    }`}>{c.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
              {credits.length > 10 && (
                <p className="text-xs text-slate-400 text-center pt-2">+{credits.length - 10} more credits</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
