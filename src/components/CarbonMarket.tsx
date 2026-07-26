import * as React from 'react';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingSpinner';
import { EmptyState } from './common/EmptyState';
import { ExpandableContent } from './common/ExpandableContent';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { useStreamReader } from '../hooks/useStreamReader';
import { CarbonCredit, MarketOrder, CarbonProjectType, CarbonPricePoint } from '../types';
import { streamAIResponse } from '../services/aiClient';
import { CARBON_EXPERT_INSTRUCTION, withLanguage } from '../config/ai';
import { useI18n } from '../config/i18n';

const projectTypes: { value: CarbonProjectType; label: string; icon: string }[] = [
  { value: 'reforestation', label: 'Reforestation', icon: '🌳' },
  { value: 'afforestation', label: 'Afforestation', icon: '🌲' },
  { value: 'conservation', label: 'Conservation', icon: '🦁' },
  { value: 'agroforestry', label: 'Agroforestry', icon: '🌿' },
  { value: 'soil_carbon', label: 'Soil Carbon', icon: '🌱' },
  { value: 'blue_carbon', label: 'Blue Carbon', icon: '🌊' },
  { value: 'renewable_energy', label: 'Renewable Energy', icon: '☀️' },
  { value: 'other', label: 'Other', icon: '🌍' },
];

function genPriceHistory(): CarbonPricePoint[] {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(now - (23 - i) * 3600000).toISOString(),
    price: +(11 + Math.sin(i * 0.5) * 2 + Math.random() * 0.5).toFixed(2),
    volume: Math.round(50 + Math.random() * 200),
  }));
}

function matchOrders(
  orders: MarketOrder[],
  type: 'buy' | 'sell',
  price: number,
  projectType?: CarbonProjectType | '',
) {
  return orders.filter(o =>
    o.type !== type &&
    (o.status === 'open' || o.status === 'partial') &&
    (type === 'buy' ? o.pricePerTonne <= price : o.pricePerTonne >= price) &&
    (!projectType || o.projectType === projectType)
  );
}

interface MarketTx {
  id: string; type: 'send' | 'receive'; counterparty: string;
  amount: number; date: string; status: 'Completed' | 'Pending' | 'Failed';
  project?: string; memo?: string; orderId?: string;
}

export const CarbonMarket: React.FC = () => {
  const [credits, setCredits] = useLocalStorage<CarbonCredit[]>('carbonCredits', []);
  const [orders, setOrders] = useLocalStorage<MarketOrder[]>('marketOrders', []);
  const [priceHistory, setPriceHistory] = useLocalStorage<CarbonPricePoint[]>('carbonPriceHistory', genPriceHistory());
  const [, setMarketTxs] = useLocalStorage<MarketTx[]>('carbonTransactions', []);
  // Ensure price history is never empty on first render
  React.useEffect(() => {
    if (priceHistory.length === 0) {
      setPriceHistory(genPriceHistory());
    }
  }, [priceHistory.length, setPriceHistory]);

  const [activeTab, setActiveTab] = useLocalStorage<'market' | 'orders'>('carbonMarketActiveTab', 'market');
  const [orderType, setOrderType] = useLocalStorage<'buy' | 'sell'>('carbonMarketOrderType', 'buy');
  const [orderPrice, setOrderPrice] = useLocalStorage('carbonMarketOrderPrice', 12.50);
  const [orderTonnes, setOrderTonnes] = useLocalStorage('carbonMarketOrderTonnes', 10);
  const [orderProjectType, setOrderProjectType] = useLocalStorage<CarbonProjectType | ''>('carbonMarketOrderProjectType', '');
  const [selectedCredit, setSelectedCredit] = useLocalStorage('carbonMarketSelectedCredit', '');
  const [showOrderForm, setShowOrderForm] = useLocalStorage('carbonMarketShowOrderForm', false);
  const [aiInsight, setAiInsight] = useLocalStorage<string | null>('carbonMarketAiInsight', null);
  const [aiInsightError, setAiInsightError] = React.useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = React.useState(false);
  const { addToast } = useToasts();
  const { t, language } = useI18n();
  const { readStream } = useStreamReader();

  const openBuyOrders = React.useMemo(
    () => orders.filter(o => o.type === 'buy' && (o.status === 'open' || o.status === 'partial')),
    [orders],
  );
  const openSellOrders = React.useMemo(
    () => orders.filter(o => o.type === 'sell' && (o.status === 'open' || o.status === 'partial')),
    [orders],
  );
  const availableCredits = React.useMemo(
    () => credits.filter(c => c.status === 'available' || c.status === 'listed'),
    [credits],
  );

  const averagePrice = React.useMemo(() => {
    if (priceHistory.length === 0) return 12.50;
    const recent = priceHistory.slice(-6);
    return +(recent.reduce((s, p) => s + p.price, 0) / recent.length).toFixed(2);
  }, [priceHistory]);

  const priceChange = React.useMemo(() => {
    if (priceHistory.length < 2) return 0;
    const latest = priceHistory[priceHistory.length - 1].price;
    const prev = priceHistory[priceHistory.length - 2].price;
    if (prev === 0) return 0;
    return +(((latest - prev) / prev) * 100).toFixed(2);
  }, [priceHistory]);

  const totalOpenBuyVolume = React.useMemo(
    () => openBuyOrders.reduce((s, o) => s + (o.tonnes - o.filledTonnes), 0),
    [openBuyOrders],
  );
  const totalOpenSellVolume = React.useMemo(
    () => openSellOrders.reduce((s, o) => s + (o.tonnes - o.filledTonnes), 0),
    [openSellOrders],
  );
  const availableVolume = React.useMemo(
    () => availableCredits.reduce((s, c) => s + c.tonnesCO2, 0),
    [availableCredits],
  );

  const placeOrder = () => {
    if (orderPrice <= 0) { addToast({ type: 'error', message: 'Price must be greater than 0.' }); return; }
    if (orderTonnes <= 0) { addToast({ type: 'error', message: 'Quantity must be greater than 0.' }); return; }

    const newOrder: MarketOrder = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      type: orderType,
      creditId: selectedCredit || undefined,
      projectType: orderProjectType || undefined,
      pricePerTonne: orderPrice,
      tonnes: orderTonnes,
      filledTonnes: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    const matchingOrders = matchOrders(
      orderType === 'buy' ? openSellOrders : openBuyOrders,
      orderType,
      orderPrice,
      orderProjectType,
    );

    if (matchingOrders.length > 0) {
      let remaining = orderTonnes;
      setOrders(prev => {
        const updated = prev.map(o => ({ ...o }));
        for (const match of matchingOrders) {
          if (remaining <= 0) break;
          const matchOrder = updated.find(o => o.id === match.id);
          if (!matchOrder) continue;
          const canFill = Math.min(remaining, matchOrder.tonnes - matchOrder.filledTonnes);
          matchOrder.filledTonnes += canFill;
          matchOrder.status = matchOrder.filledTonnes >= matchOrder.tonnes ? 'filled' : 'partial';
          remaining -= canFill;
        }
        newOrder.filledTonnes = orderTonnes - remaining;
        newOrder.status = remaining <= 0 ? 'filled' : 'partial';
        return [newOrder, ...updated];
      });

      if (orderType === 'sell') {
        setCredits(prev => prev.map(c =>
          matchingOrders.some(m => m.creditId === c.id)
            ? { ...c, status: 'retired' as const, retirementDate: new Date().toISOString(), retiree: 'Market Buyer' }
            : c
        ));
      }

      const filled = orderTonnes - remaining;
      if (filled > 0) {
        const now = new Date().toISOString().slice(0, 10);
        const projectTypeLabel = orderProjectType ? orderProjectType.replace('_', ' ') : 'Carbon Credit';
        const txId = `MKTX-${Date.now().toString(36).toUpperCase()}`;
        setMarketTxs(prev => [
          { id: txId + '-B', type: 'receive', counterparty: 'Market Seller', amount: filled, date: now, status: 'Completed', project: projectTypeLabel, memo: 'Bought on market', orderId: newOrder.id },
          { id: txId + '-S', type: 'send', counterparty: 'Market Buyer', amount: filled, date: now, status: 'Completed', project: projectTypeLabel, memo: 'Sold on market', orderId: newOrder.id },
          ...prev,
        ]);
      }

      addToast({ type: 'success', message: `${orderType === 'buy' ? 'Buy' : 'Sell'} order placed${filled > 0 ? `. ${filled} tCO₂ matched instantly!` : ''}` });
    } else {
      setOrders(prev => [newOrder, ...prev]);
      const projectTypeLabel = orderProjectType ? orderProjectType.replace('_', ' ') : 'Carbon Credit';
      setMarketTxs(prev => [{
        id: `MKTX-${Date.now().toString(36).toUpperCase()}-P`,
        type: orderType === 'buy' ? 'receive' : 'send',
        counterparty: orderType === 'buy' ? 'Pending Seller' : 'Pending Buyer',
        amount: orderTonnes, date: new Date().toISOString().slice(0, 10),
        status: 'Pending', project: projectTypeLabel, orderId: newOrder.id,
      }, ...prev]);
      addToast({ type: 'info', message: `${orderType === 'buy' ? 'Buy' : 'Sell'} order placed on order book.` });
    }

    if (orderType === 'sell') {
      setPriceHistory(prev => [...prev, {
        timestamp: new Date().toISOString(), price: orderPrice, volume: orderTonnes,
        projectType: orderProjectType || undefined,
      }].slice(-168));
    } else if (orderType === 'buy' && selectedCredit) {
      setPriceHistory(prev => [...prev, {
        timestamp: new Date().toISOString(), price: orderPrice, volume: orderTonnes,
        projectType: orderProjectType || undefined,
      }].slice(-168));
    }
    if (orderType === 'sell' && selectedCredit) {
      setCredits(prev => prev.map(c =>
        c.id === selectedCredit ? { ...c, pricePerTonne: orderPrice, status: 'listed' as const } : c
      ));
    }

    setShowOrderForm(false);
    setOrderTonnes(10);
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
    addToast({ type: 'info', message: 'Order cancelled.' });
  };

  const handleListCredit = (creditId: string) => {
    const credit = credits.find(c => c.id === creditId);
    if (credit) {
      setSelectedCredit(creditId);
      setOrderType('sell');
      setOrderPrice(credit.pricePerTonne);
      setOrderTonnes(credit.tonnesCO2);
      setShowOrderForm(true);
    }
  };

  const getAiMarketInsight = async () => {
    setIsLoadingInsight(true);
    setAiInsightError(null);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const recentPrices = priceHistory.slice(-12);
      const prompt = `Analyze the current carbon credit market:\n\nCurrent Average Price: $${averagePrice}\n24h Price Change: ${priceChange}%\nAvailable Credits: ${availableCredits.length} (${availableVolume} tCO₂)\nBuy Orders: ${openBuyOrders.length} (${totalOpenBuyVolume} tCO₂ demand)\nSell Orders: ${openSellOrders.length} (${totalOpenSellVolume} tCO₂ supply)\n\nRecent Prices (last 12h):\n${recentPrices.map(p => `  ${new Date(p.timestamp).toLocaleTimeString()}: $${p.price.toFixed(2)} (${p.volume}t)`).join('\n')}\n\nAvailable by type:\n${projectTypes.map(pt => { const count = availableCredits.filter(c => c.projectType === pt.value).length; return count > 0 ? `  ${pt.icon} ${pt.label}: ${count}` : null; }).filter(Boolean).join('\n')}\n\nProvide: 1. Market trend analysis 2. Price prediction for 24h 3. Recommended bid/ask strategy 4. Supply/demand observations 5. Fair value estimate by type`;

      const stream = await streamAIResponse('chat', {
        messages: [{ role: 'user', text: prompt }],
        systemInstruction: withLanguage(CARBON_EXPERT_INSTRUCTION, language),
      });
      let fullText = '';
      await readStream(stream, chunk => {
        fullText += chunk;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setAiInsight(fullText), 50);
      }, undefined, { streamTimeout: 45000, totalTimeout: 180000 });
      if (timeoutId) clearTimeout(timeoutId);
      setAiInsight(fullText);
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      setAiInsightError(e instanceof Error ? e.message : 'Failed to get market insight.');
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const maxPrice = React.useMemo(
    () => Math.max(...priceHistory.slice(-24).map(p => p.price), 1),
    [priceHistory],
  );

  const nonCancelledOrders = React.useMemo(
    () => orders.filter(o => o.status !== 'cancelled'),
    [orders],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('market.marketPrice')}</p><p className="text-2xl font-bold text-brand-green-700">${averagePrice}</p><p className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>/tCO₂ {priceChange >= 0 ? '↑' : '↓'} {Math.abs(priceChange)}%</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('market.availableCredits')}</p><p className="text-2xl font-bold text-blue-700">{availableCredits.length}</p><p className="text-xs text-slate-500">{availableVolume} tCO₂ total</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('market.openBuyOrders')}</p><p className="text-2xl font-bold text-green-700">{openBuyOrders.length}</p><p className="text-xs text-slate-500">{totalOpenBuyVolume} tCO₂ demand</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('market.openSellOrders')}</p><p className="text-2xl font-bold text-red-700">{openSellOrders.length}</p><p className="text-xs text-slate-500">{totalOpenSellVolume} tCO₂ supply</p></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex gap-2" role="tablist" aria-label="Market views">
                <button role="tab" id="tab-market" aria-selected={activeTab === 'market'} aria-controls="tabpanel-market" onClick={() => setActiveTab('market')}
                  className={`px-3 py-1 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[36px] ${activeTab === 'market' ? 'bg-brand-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{t('market.orderBook')}</button>
                <button role="tab" id="tab-orders" aria-selected={activeTab === 'orders'} aria-controls="tabpanel-orders" onClick={() => setActiveTab('orders')}
                  className={`px-3 py-1 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[36px] ${activeTab === 'orders' ? 'bg-brand-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{t('market.myOrders')}</button>
              </div>
              <button onClick={() => setShowOrderForm(!showOrderForm)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                {showOrderForm ? t('common.cancel') : '+ ' + t('market.placeOrder')}
              </button>
            </div>

            {showOrderForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-700">{t(orderType === 'buy' ? 'market.placeBuyOrder' : 'market.placeSellOrder')}</h3>
                <div className="flex gap-2 mb-2" role="radiogroup" aria-label="Order type">
                  <button role="radio" aria-checked={orderType === 'buy'} onClick={() => { setOrderType('buy'); setSelectedCredit(''); }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${orderType === 'buy' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{t('market.buy')}</button>
                  <button role="radio" aria-checked={orderType === 'sell'} onClick={() => setOrderType('sell')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${orderType === 'sell' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{t('market.sell')}</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="order-price" className="block text-xs font-medium text-slate-600 mb-1">{t('market.price')}</label>
                    <input id="order-price" type="number" step="0.01" min="0.01" value={orderPrice} onChange={e => setOrderPrice(Math.max(0.01, Number(e.target.value)))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                  <div>
                    <label htmlFor="order-qty" className="block text-xs font-medium text-slate-600 mb-1">{t('market.quantity')}</label>
                    <input id="order-qty" type="number" step="1" min="1" value={orderTonnes} onChange={e => setOrderTonnes(Math.max(1, Number(e.target.value)))} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500" />
                  </div>
                  <div className={orderType === 'sell' ? '' : 'col-span-2'}>
                    <label htmlFor="order-type-filter" className="block text-xs font-medium text-slate-600 mb-1">{t('market.projectType')}</label>
                    <select id="order-type-filter" value={orderProjectType} onChange={e => setOrderProjectType(e.target.value as CarbonProjectType | '')} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                      <option value="">{t('market.anyType')}</option>
                      {projectTypes.map(pt => <option key={pt.value} value={pt.value}>{pt.icon} {pt.label}</option>)}
                    </select>
                  </div>
                  {orderType === 'sell' && (
                    <div>
                      <label htmlFor="order-credit" className="block text-xs font-medium text-slate-600 mb-1">{t('market.selectCredit')}</label>
                      <select id="order-credit" value={selectedCredit} onChange={e => {
                        setSelectedCredit(e.target.value);
                        const credit = credits.find(c => c.id === e.target.value);
                        if (credit) { setOrderPrice(credit.pricePerTonne); setOrderTonnes(credit.tonnesCO2); }
                      }} className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                        <option value="">-- Select --</option>
                        {availableCredits.map(c => <option key={c.id} value={c.id}>{c.serialNumber} ({c.tonnesCO2}t @ ${c.pricePerTonne})</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {t('market.total')}: <strong>${(orderPrice * orderTonnes).toFixed(2)}</strong> at ${orderPrice}/t for {orderTonnes} tCO₂
                </div>
                <button onClick={placeOrder}
                  disabled={orderType === 'sell' && !selectedCredit && availableCredits.length > 0}
                  className="w-full py-2 text-sm font-bold text-white bg-brand-green-600 rounded-lg hover:bg-brand-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-green-500">
                  {t(orderType === 'buy' ? 'market.placeBuyOrder' : 'market.placeSellOrder')}
                </button>
              </div>
            )}

            {activeTab === 'market' ? (
              <div id="tabpanel-market" role="tabpanel" aria-labelledby="tab-market" className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto">
                <div className="p-3">
                  <h4 className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wider">{t('market.sellOrders')}</h4>
                  {openSellOrders.length === 0 ? (
                    <EmptyState
                      title={t('market.noSellOrders')}
                      description="No sell orders currently on the order book."
                      className="py-6"
                    />
                  ) : (
                    <div className="space-y-1" role="list">{openSellOrders.slice(0, 15).map(o => (
                      <div key={o.id} className="flex justify-between items-center p-2 bg-red-50 rounded text-sm">
                        <div><span className="font-semibold text-slate-700">${o.pricePerTonne.toFixed(2)}</span><span className="text-xs text-slate-500 ml-2">{o.tonnes - o.filledTonnes} t</span></div>
                        <span className="text-xs text-slate-500" aria-hidden="true">{o.projectType ? projectTypes.find(pt => pt.value === o.projectType)?.icon : '🌍'}</span>
                      </div>
                    ))}</div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wider">{t('market.buyOrders')}</h4>
                  {openBuyOrders.length === 0 ? (
                    <EmptyState
                      title={t('market.noBuyOrders')}
                      description="No buy orders currently on the order book."
                      className="py-6"
                    />
                  ) : (
                    <div className="space-y-1" role="list">{openBuyOrders.slice(0, 15).map(o => (
                      <div key={o.id} className="flex justify-between items-center p-2 bg-green-50 rounded text-sm">
                        <div><span className="font-semibold text-slate-700">${o.pricePerTonne.toFixed(2)}</span><span className="text-xs text-slate-500 ml-2">{o.tonnes - o.filledTonnes} t</span></div>
                        <span className="text-xs text-slate-500" aria-hidden="true">{o.projectType ? projectTypes.find(pt => pt.value === o.projectType)?.icon : '🌍'}</span>
                      </div>
                    ))}</div>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">{t('market.availableForSale')}</h4>
                  {availableCredits.length === 0 ? (
                    <EmptyState
                      title={t('market.noCreditsForSale')}
                      description="No carbon credits currently available for sale."
                      className="py-6"
                    />
                  ) : (
                    <div className="space-y-1" role="list">{availableCredits.slice(0, 10).map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-700">{c.serialNumber}</span>
                          <span className="text-xs text-slate-500 ml-2">{c.projectName} · {c.vintage}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-medium text-slate-700">${c.pricePerTonne}/t</span>
                          <button onClick={() => handleListCredit(c.id)} className="text-xs text-brand-green-600 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded">{t('market.sell')}</button>
                        </div>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div>
            ) : (
              <div id="tabpanel-orders" role="tabpanel" aria-labelledby="tab-orders" className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100">
                {nonCancelledOrders.length === 0 ? (
                  <EmptyState
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75H17.25m-7.5 3h9" /></svg>}
                    title={t('market.noOrders')}
                    description={t('market.noOrders.desc')}
                    actionLabel={t('market.placeOrder')}
                    onAction={() => setShowOrderForm(true)}
                  />
                ) : nonCancelledOrders.map(o => (
                  <div key={o.id} className="p-3 flex justify-between items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${o.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{o.type.toUpperCase()}</span>
                        <span className="text-sm font-semibold text-slate-700">${o.pricePerTonne.toFixed(2)}/t</span>
                      </div>
                      <p className="text-xs text-slate-500">{o.filledTonnes}/{o.tonnes} tCO₂ filled · {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${o.status === 'filled' ? 'bg-green-100 text-green-700' : o.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{o.status}</span>
                      {(o.status === 'open' || o.status === 'partial') && (
                        <button onClick={() => cancelOrder(o.id)} className="text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded">{t('common.cancel')}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="p-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">{t('market.priceHistory')}</h3>
              <button onClick={() => setPriceHistory(genPriceHistory())}
                className="text-xs text-brand-green-600 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded">
                {t('market.refresh')}
              </button>
            </div>
            <div className="p-3">
              <div className="h-32 flex items-end gap-px" role="img" aria-label="Price chart showing last 24 hours">
                {priceHistory.slice(-24).map((p, i) => {
                  const height = (p.price / maxPrice) * 100;
                  return (
                    <div key={`${p.timestamp}-${i}`} className="flex-1 flex flex-col items-center justify-end" title={`${new Date(p.timestamp).toLocaleString()}: $${p.price.toFixed(2)}`}>
                      <div className="w-full bg-brand-green-500 rounded-t hover:bg-brand-green-600 transition-all" style={{ height: `${Math.max(height, 1)}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{priceHistory[0] ? new Date(priceHistory[0].timestamp).toLocaleTimeString([], { hour: '2-digit' }) : ''}</span>
                <span>{priceHistory[priceHistory.length - 1] ? new Date(priceHistory[priceHistory.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit' }) : ''}</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">{t('market.aiInsight')}</h3>
              <button onClick={getAiMarketInsight} disabled={isLoadingInsight}
                className="text-xs text-brand-green-600 hover:underline disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded">
                {isLoadingInsight ? t('market.analyzing') : t('market.refresh')}
              </button>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto text-sm text-slate-600" role="status" aria-live="polite">
              {isLoadingInsight ? (
                <LoadingSpinner size="sm" message="Analyzing market..." />
              ) : aiInsightError ? (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-red-700 text-sm">{aiInsightError}</p>
                  <button onClick={getAiMarketInsight} className="mt-2 text-xs font-semibold text-brand-green-600 hover:text-brand-green-800 focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px]">
                    {t('common.retry') || 'Retry'}
                  </button>
                </div>
              ) : aiInsight ? (
                <ExpandableContent content={aiInsight} maxLength={600} />
              ) : (
                <p className="text-slate-400 italic">{t('market.insight.empty')}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
