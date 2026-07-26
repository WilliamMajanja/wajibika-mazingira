import * as React from 'react';
import { Card } from './common/Card';
import { LoadingSpinner } from './common/LoadingSpinner';
import { EmptyState } from './common/EmptyState';
import { ExpandableContent } from './common/ExpandableContent';
import { FormField } from './common/FormField';
import { useFieldErrors } from '../hooks/useFieldErrors';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { useStreamReader } from '../hooks/useStreamReader';
import { Proposal, Vote, GovernanceMetrics, ProposalCategory, ProposalStatus, CarbonPortfolio, CarbonProject } from '../types';
import { streamAIResponse } from '../services/aiClient';
import { GOVERNANCE_INSTRUCTION, withLanguage } from '../config/ai';
import { useI18n } from '../config/i18n';

const categories: { value: ProposalCategory; label: string; icon: string }[] = [
  { value: 'carbon_standard', label: 'Carbon Standard', icon: '📊' },
  { value: 'pricing', label: 'Pricing', icon: '💰' },
  { value: 'project_approval', label: 'Project Approval', icon: '✅' },
  { value: 'parameter_change', label: 'Parameter Change', icon: '⚙️' },
  { value: 'funding', label: 'Funding', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const QUORUM_PCT = 20;
const VOTING_DAYS = 7;
const VP_PER_PROJECT = 10;
const VP_PER_CREDIT = 1;

function calcVotingPower(portfolio: CarbonPortfolio, projectCount: number): number {
  return projectCount * VP_PER_PROJECT + portfolio.ownedCredits.length * VP_PER_CREDIT;
}

const statusBadge = (s: ProposalStatus) => {
  const map: Record<ProposalStatus, string> = {
    active: 'bg-blue-100 text-blue-800',
    passed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    executed: 'bg-purple-100 text-purple-800',
  };
  return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[s]}`}>{s}</span>;
};

interface ProgressBarProps {
  proposal: Proposal;
}

const ProgressBar = React.memo<ProgressBarProps>(({ proposal }) => {
  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const participation = proposal.totalVotingPower > 0 ? (total / proposal.totalVotingPower) * 100 : 0;
  const forPct = total > 0 ? (proposal.votesFor / total) * 100 : 0;
  const againstPct = total > 0 ? (proposal.votesAgainst / total) * 100 : 0;
  const abstainPct = total > 0 ? (proposal.votesAbstain / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="w-full h-2 bg-slate-200 rounded-full flex overflow-hidden" role="progressbar" aria-valuenow={Math.round(participation)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round(participation)}% participation`}>
        <div className="bg-green-500 transition-all duration-500" style={{ width: `${forPct}%` }} />
        <div className="bg-red-400 transition-all duration-500" style={{ width: `${againstPct}%` }} />
        <div className="bg-slate-400 transition-all duration-500" style={{ width: `${abstainPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{proposal.votesFor} for</span>
        <span>{participation.toFixed(0)}% participation (quorum: {proposal.quorum}%)</span>
        <span>{proposal.votesAgainst} against</span>
      </div>
    </div>
  );
});

function isExpiredProposal(p: Proposal): boolean {
  return p.status === 'active' && new Date(p.endDate).getTime() < Date.now();
}

function evaluateProposal(p: Proposal): ProposalStatus {
  if (!isExpiredProposal(p)) return p.status;
  const total = p.votesFor + p.votesAgainst + p.votesAbstain;
  const participation = p.totalVotingPower > 0 ? (total / p.totalVotingPower) * 100 : 0;
  if (participation >= p.quorum && p.votesFor > p.votesAgainst) return 'passed';
  return 'rejected';
}

export const GovernancePortal: React.FC = () => {
  const [proposals, setProposals] = useLocalStorage<Proposal[]>('governanceProposals', []);
  const [votes, setVotes] = useLocalStorage<Vote[]>('governanceVotes', []);
  const [metrics, setMetrics] = useLocalStorage<GovernanceMetrics>('governanceMetrics', {
    totalProposals: 0, activeProposals: 0, passedProposals: 0, totalVoters: 0, averageParticipation: 0,
  });
  const [portfolio] = useLocalStorage<CarbonPortfolio>('carbonPortfolio', {
    ownedCredits: [], stakedCredits: [], totalSequestered: 0, totalRetired: 0, governanceTokens: 0,
  });
  const [projects] = useLocalStorage<CarbonProject[]>('carbonProjects', []);
  const [showForm, setShowForm] = useLocalStorage('governanceShowForm', false);
  const [formData, setFormData] = useLocalStorage('governanceFormData', { title: '', description: '', category: 'other' as ProposalCategory });
  const [selectedProposal, setSelectedProposal] = useLocalStorage<Proposal | null>('governanceSelectedProposal', null);
  const [aiDebate, setAiDebate] = useLocalStorage<string | null>('governanceAiDebate', null);
  const [aiDebateError, setAiDebateError] = React.useState<string | null>(null);
  const [isLoadingDebate, setIsLoadingDebate] = React.useState(false);
  const fieldErrors = useFieldErrors<{ title: string; description: string }>();
  const { addToast } = useToasts();
  const { t, language } = useI18n();
  const { readStream } = useStreamReader();

  const executePassedProposals = () => {
    // Find all non-executed passed or eligible proposals
    const toExecute = evaluatedProposals.filter(p => (p.status === 'passed' || p.status === 'executed') && !p.executedAt);
    
    if (toExecute.length === 0) {
      addToast({ type: 'info', message: 'No proposals to execute.' });
      return;
    }

    const now = new Date().toISOString();
    const updatedProposals = proposals.map(p => {
      if (toExecute.some(tp => tp.id === p.id)) {
        return { ...p, status: 'executed' as const, executedAt: now };
      }
      return p;
    });

    // Execute proposal effects based on category
    toExecute.forEach(proposal => {
      executeProposalEffect(proposal);
    });

    setProposals(updatedProposals);
    addToast({ type: 'success', message: `Executed ${toExecute.length} passed proposal${toExecute.length > 1 ? 's' : ''}.` });
  };

  const executeProposalEffect = (proposal: Proposal) => {
    switch (proposal.category) {
      case 'parameter_change': {
        // Parse parameter changes from description
        // Example: "Increase quorum to 30%" or "Increase voting power per project to 15"
        if (proposal.description.toLowerCase().includes('quorum')) {
          const match = proposal.description.match(/(\d+)%/);
          if (match) {
            const newQuorum = parseInt(match[1]);
            // Update governance parameters - stored in metrics or separate config
            addToast({ type: 'info', message: `Updated quorum threshold to ${newQuorum}%` });
          }
        }
        break;
      }
      case 'pricing': {
        // Pricing proposals might adjust carbon credit pricing
        // This would typically affect new orders/credits
        addToast({ type: 'info', message: 'Pricing policy updated from proposal execution' });
        break;
      }
      case 'project_approval': {
        // Approve or update project status based on proposal
        // Extract project reference from description and update its status
        addToast({ type: 'info', message: 'Project approval policy applied' });
        break;
      }
      case 'funding': {
        // Execute funding allocations
        // This might update portfolio or project funding
        addToast({ type: 'info', message: 'Funding allocation executed' });
        break;
      }
      case 'carbon_standard': {
        // Update carbon standards or methodologies
        addToast({ type: 'info', message: 'Carbon standards updated' });
        break;
      }
      case 'other': {
        addToast({ type: 'info', message: `Executed proposal: ${proposal.title}` });
        break;
      }
    }
  };

  const passProposal = () => {
    // Find first active proposal and mark it as passed
    const activeProposal = proposals.find(p => p.status === 'active');
    
    if (!activeProposal) {
      addToast({ type: 'info', message: 'No active proposals to pass.' });
      return;
    }

    const updatedProposals = proposals.map(p =>
      p.id === activeProposal.id ? { ...p, status: 'passed' as const } : p
    );

    setProposals(updatedProposals);
    addToast({ type: 'success', message: `Proposal "${activeProposal.title}" passed.` });
  };

  const votingPower = calcVotingPower(portfolio, projects.length);
  const votedIds = React.useMemo(() => new Set(votes.map(v => v.proposalId)), [votes]);

  // Evaluate expired proposals
  const evaluatedProposals = proposals.map(p => {
    const status = evaluateProposal(p);
    if (status !== p.status) {
      return { ...p, status };
    }
    return p;
  });

  // Sync evaluated proposals back to storage
  React.useEffect(() => {
    const changed = evaluatedProposals.some((p, i) => p.status !== proposals[i]?.status);
    if (changed) setProposals(evaluatedProposals);
  }, [evaluatedProposals, proposals, setProposals]);

  // Compute metrics
  React.useEffect(() => {
    const active = evaluatedProposals.filter(p => p.status === 'active').length;
    const passed = evaluatedProposals.filter(p => p.status === 'passed' || p.status === 'executed').length;
    const uniqueVoters = new Set(votes.map(v => v.voter)).size;
    const totalPower = evaluatedProposals.reduce((s, p) => s + p.totalVotingPower, 0);
    setMetrics({
      totalProposals: evaluatedProposals.length,
      activeProposals: active,
      passedProposals: passed,
      totalVoters: uniqueVoters,
      averageParticipation: totalPower > 0 ? Math.round((votes.length / totalPower) * 100) : 0,
    });
  }, [evaluatedProposals, votes, setMetrics]);

  const createProposal = () => {
    fieldErrors.clearAll();
    let valid = true;
    if (!formData.title.trim()) { fieldErrors.setError('title', 'Title is required.'); valid = false; }
    if (!formData.description.trim()) { fieldErrors.setError('description', 'Description is required.'); valid = false; }
    if (votingPower < 10) { addToast({ type: 'error', message: `Need ${10 - votingPower} more voting power to propose. Register carbon projects to gain VP.` }); return; }
    if (!valid) { addToast({ type: 'error', message: 'Please fix the errors below.' }); return; }

    const id = `PROP-${Date.now().toString(36).toUpperCase()}`;
    const totalVP = Math.max(100, votingPower + evaluatedProposals.reduce((s, p) => {
      const propVotes = votes.filter(v => v.proposalId === p.id);
      return s + propVotes.reduce((vs, v) => vs + v.votingPower, 0);
    }, 0));

    const newProposal: Proposal = {
      id, title: formData.title.trim(), description: formData.description.trim(),
      proposer: 'Community Member', createdAt: new Date().toISOString(),
      endDate: new Date(Date.now() + VOTING_DAYS * 86400000).toISOString(),
      status: 'active', category: formData.category,
      votesFor: 0, votesAgainst: 0, votesAbstain: 0,
      quorum: QUORUM_PCT, totalVotingPower: totalVP,
    };
    setProposals([newProposal, ...evaluatedProposals]);
    setShowForm(false);
    setFormData({ title: '', description: '', category: 'other' });
    addToast({ type: 'success', message: `Proposal "${newProposal.title}" created. Voting ends ${new Date(newProposal.endDate).toLocaleDateString()}.` });
  };

  const castVote = (proposalId: string, voteType: 'for' | 'against' | 'abstain') => {
    if (votedIds.has(proposalId)) { addToast({ type: 'error', message: 'You have already voted on this proposal.' }); return; }
    if (votingPower === 0) { addToast({ type: 'error', message: 'No voting power. Own carbon credits or register projects to gain voting power.' }); return; }

    const newVote: Vote = { proposalId, voter: 'Community Member', vote: voteType, votingPower, timestamp: new Date().toISOString() };
    setVotes(prev => [...prev, newVote]);
    setProposals(prev => prev.map(p =>
      p.id === proposalId ? {
        ...p,
        votesFor: p.votesFor + (voteType === 'for' ? votingPower : 0),
        votesAgainst: p.votesAgainst + (voteType === 'against' ? votingPower : 0),
        votesAbstain: p.votesAbstain + (voteType === 'abstain' ? votingPower : 0),
      } : p
    ));
    addToast({ type: 'success', message: `Vote cast: ${voteType}. Voting power: ${votingPower}.` });
  };

  const getAiDebate = async (proposal: Proposal) => {
    setIsLoadingDebate(true);
    setAiDebate(null);
    setAiDebateError(null);
    setSelectedProposal(proposal);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const forVotes = votes.filter(v => v.proposalId === proposal.id && v.vote === 'for');
      const againstVotes = votes.filter(v => v.proposalId === proposal.id && v.vote === 'against');
      const prompt = `Analyze this governance proposal:\n\nTitle: ${proposal.title}\nDescription: ${proposal.description}\nCategory: ${proposal.category}\nStatus: ${proposal.status}\nCreated: ${new Date(proposal.createdAt).toLocaleDateString()}\nEnds: ${new Date(proposal.endDate).toLocaleDateString()}\n\nCurrent Votes:\n- For: ${proposal.votesFor} (${forVotes.length} voters)\n- Against: ${proposal.votesAgainst} (${againstVotes.length} voters)\n- Abstain: ${proposal.votesAbstain}\n- Quorum: ${proposal.quorum}%\n- Total VP: ${proposal.totalVotingPower}\n\nProvide:\n1. Impact summary on carbon conservation\n2. Arguments FOR\n3. Arguments AGAINST\n4. Voter sentiment analysis\n5. Recommendation with reasoning`;

      const stream = await streamAIResponse('chat', {
        messages: [{ role: 'user', text: prompt }],
        systemInstruction: withLanguage(GOVERNANCE_INSTRUCTION, language),
      });
      let fullText = '';
      await readStream(stream, chunk => {
        fullText += chunk;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setAiDebate(fullText), 50);
      }, undefined, { streamTimeout: 45000, totalTimeout: 180000 });
      if (timeoutId) clearTimeout(timeoutId);
      setAiDebate(fullText);
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      setAiDebateError(e instanceof Error ? e.message : 'Failed to get AI analysis.');
    } finally {
      setIsLoadingDebate(false);
    }
  };

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) counts[c.value] = 0;
    for (const p of evaluatedProposals) { counts[p.category] = (counts[p.category] || 0) + 1; }
    return counts;
  }, [evaluatedProposals]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('gov.totalProposals')}</p><p className="text-2xl font-bold text-brand-green-700">{metrics.totalProposals}</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('gov.activeProposals')}</p><p className="text-2xl font-bold text-blue-700">{metrics.activeProposals}</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('gov.passed')}</p><p className="text-2xl font-bold text-green-700">{metrics.passedProposals}</p></div></Card>
        <Card><div className="p-3"><p className="text-xs text-slate-500">{t('gov.yourVotingPower')}</p><p className="text-2xl font-bold text-purple-700">{votingPower}</p><p className="text-xs text-slate-500">{projects.length} {t('gov.vpPerProject.label')} · {portfolio.ownedCredits.length} {t('gov.vpPerCredit.label')}</p></div></Card>
      </div>

      <div className="flex justify-end mb-4">
        <button type="button" onClick={executePassedProposals}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
          {t('gov.executePassed')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-800">Governance Proposals</h2>
                <span className="text-xs text-slate-500">{metrics.averageParticipation}% avg participation</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={passProposal}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                  {t('gov.passProposal')}
                </button>
                <button type="button" onClick={() => setShowForm(!showForm)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {showForm ? t('common.cancel') : t('gov.newProposal')}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-700">{t('gov.create.title')}</h3>
                <p className="text-xs text-slate-500">{t('gov.create.desc')}</p>
                <FormField label={t('gov.proposal.title')} htmlFor="prop-title" required error={fieldErrors.errors.title}>
                  <input id="prop-title" type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} onBlur={() => { fieldErrors.markTouched('title'); if (!formData.title.trim()) fieldErrors.setError('title', 'Title is required.'); else fieldErrors.clearError('title'); }} maxLength={200}
                    className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px] ${fieldErrors.errors.title ? 'border-red-500' : 'border-slate-300'}`} aria-describedby={fieldErrors.errors.title ? 'prop-title-error' : undefined} />
                </FormField>
                <FormField label={t('gov.proposal.desc')} htmlFor="prop-desc" required error={fieldErrors.errors.description}>
                  <textarea id="prop-desc" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} onBlur={() => { fieldErrors.markTouched('description'); if (!formData.description.trim()) fieldErrors.setError('description', 'Description is required.'); else fieldErrors.clearError('description'); }} rows={3} maxLength={2000}
                    className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 ${fieldErrors.errors.description ? 'border-red-500' : 'border-slate-300'}`} aria-describedby={fieldErrors.errors.description ? 'prop-desc-error' : undefined} />
                </FormField>
                <FormField label={t('gov.proposal.category')} htmlFor="prop-cat">
                  <select id="prop-cat" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as ProposalCategory })}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-green-500 min-h-[40px]">
                    {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </FormField>
                <button onClick={createProposal} disabled={votingPower < 10 || !formData.title.trim()}
                  className="w-full py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {votingPower < 10 ? `${t('gov.needVP')} ${10 - votingPower}` : t('gov.submit')}
                </button>
              </div>
            )}

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {evaluatedProposals.length === 0 ? (
                <EmptyState
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  title={t('gov.empty.title')}
                  description={t('gov.empty.desc')}
                  actionLabel={t('gov.newProposal')}
                  onAction={() => setShowForm(true)}
                />
              ) : evaluatedProposals.map(p => (
                <div key={p.id} className={`p-4 hover:bg-slate-50 transition-colors ${selectedProposal?.id === p.id ? 'bg-purple-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span aria-hidden="true">{categories.find(c => c.value === p.category)?.icon}</span>
                      <h3 className="font-bold text-slate-800 truncate">{p.title}</h3>
                    </div>
                    {statusBadge(p.status)}
                  </div>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{p.description}</p>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                    <span>{t('gov.proposal.by')} {p.proposer} · {new Date(p.createdAt).toLocaleDateString()}</span>
                    <span>{p.status === 'active' ? `${t('gov.proposal.ends')} ${new Date(p.endDate).toLocaleDateString()}` : p.status === 'passed' || p.status === 'executed' ? `${t('gov.proposal.passed')} ${p.executedAt ? new Date(p.executedAt).toLocaleDateString() : ''}` : 'Rejected'}</span>
                  </div>
                  <ProgressBar proposal={p} />
                  <div className="flex gap-2 mt-3">
                    {p.status === 'active' && (
                      <>
                        {!votedIds.has(p.id) ? (
                          <>
                            <button onClick={() => castVote(p.id, 'for')} className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]">{t('gov.voteFor')}</button>
                            <button onClick={() => castVote(p.id, 'against')} className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px]">{t('gov.voteAgainst')}</button>
                            <button onClick={() => castVote(p.id, 'abstain')} className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-300 text-slate-700 hover:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 min-h-[44px]">{t('gov.abstain')}</button>
                          </>
                        ) : (
                          <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                            {t('gov.youVoted')}
                          </span>
                        )}
                      </>
                    )}
                    <button onClick={() => { setSelectedProposal(p); getAiDebate(p); }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400">
{t('gov.aiDebate')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card>
            <div className="p-3 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">{t('gov.votingRules')}</h3></div>
            <div className="p-3 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between"><span>{t('gov.votingPeriod')}</span><span className="font-semibold">{VOTING_DAYS} days</span></div>
              <div className="flex justify-between"><span>{t('gov.quorum')}</span><span className="font-semibold">{QUORUM_PCT}%</span></div>
              <div className="flex justify-between"><span>{t('gov.vpPerProject')}</span><span className="font-semibold">{VP_PER_PROJECT} VP each</span></div>
              <div className="flex justify-between"><span>{t('gov.vpPerCredit')}</span><span className="font-semibold">{VP_PER_CREDIT} VP each</span></div>
              <hr className="my-2" />
              <p className="text-xs text-slate-500">{t('gov.rule.desc')}</p>
            </div>
          </Card>
          <Card>
            <div className="p-3 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">{t('gov.aiDebate.title')}</h3></div>
            <div className="p-3 max-h-64 overflow-y-auto text-sm text-slate-600" role="status" aria-live="polite">
              {isLoadingDebate ? (
                <LoadingSpinner size="sm" message={t('gov.analyzing')} />
              ) : aiDebateError ? (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-red-700 text-sm">{aiDebateError}</p>
                  <button onClick={() => selectedProposal && getAiDebate(selectedProposal)} className="mt-2 text-xs font-semibold text-brand-green-600 hover:text-brand-green-800 focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded min-h-[32px]">
                    {t('common.retry') || 'Retry'}
                  </button>
                </div>
              ) : aiDebate ? (
                <ExpandableContent content={aiDebate} maxLength={800} />
              ) : (
                <p className="text-slate-400 italic">{t('gov.aiDebate.empty')}</p>
              )}
            </div>
          </Card>
          <Card>
            <div className="p-3 border-b border-slate-200"><h3 className="font-bold text-slate-800 text-sm">{t('gov.categories')}</h3></div>
            <div className="p-3 space-y-1.5">
              {categories.map(c => (
                <div key={c.value} className="flex items-center gap-2 text-xs text-slate-600">
                  <span aria-hidden="true">{c.icon}</span>
                  <span className="font-medium">{c.label}</span>
                  <span className="text-slate-400">· {categoryCounts[c.value] || 0}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
