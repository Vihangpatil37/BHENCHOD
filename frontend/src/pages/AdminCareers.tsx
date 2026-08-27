import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { adminCareersApi } from '../api/adminCareers';
import {
  Search, ChevronLeft, ChevronRight,
  X, Loader2, CheckCircle, AlertTriangle, RefreshCw,
  Eye, EyeOff, FileText,
  Sparkles, Sliders, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/motion';
import { formatDateTime } from '../lib/formatDate';

const TRAITS = [
  'analytical_thinking', 'creativity', 'communication', 'leadership',
  'research', 'business_acumen', 'technical_curiosity', 'empathy',
  'patience', 'risk_tolerance',
];

const CATEGORIES = [
  'science', 'commerce', 'arts_humanities', 'diploma',
  'iti_polytechnic', 'vocational', 'government_defence', 'emerging_future',
];

type TabView = 'table' | 'backfill' | 'audit' | 'enrichment';

export const AdminCareers: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabView>('table');

  // Table state
  const [careers, setCareers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, total_pages: 0 });
  const [tableLoading, setTableLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [backfillFilter, setBackfillFilter] = useState('');
  const [enrichmentFilter, setEnrichmentFilter] = useState('');
  const [sortBy] = useState('name');
  const [sortOrder] = useState('asc');

  // Detail drawer state
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [detailCareer, setDetailCareer] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Audit state
  const [auditData, setAuditData] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Bulk publish state
  const [bulkPublishing, setBulkPublishing] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchCareers = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await adminCareersApi.list({
        page: pagination.page,
        limit: pagination.limit,
        category_code: categoryFilter || undefined,
        backfill_status: backfillFilter || undefined,
        needs_enrichment: enrichmentFilter === 'true' ? 'true' : enrichmentFilter === 'false' ? 'false' : undefined,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setCareers(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      if (err.response?.status === 401) { clearAuth(); navigate('/login'); }
    } finally {
      setTableLoading(false);
    }
  }, [pagination.page, pagination.limit, categoryFilter, backfillFilter, enrichmentFilter, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const fetchDetail = async (careerCode: string) => {
    setDetailLoading(true);
    setSelectedCode(careerCode);
    try {
      const career = await adminCareersApi.get(careerCode);
      setDetailCareer(career);
      setEditData({});
      setEditMode(false);
    } catch (err) {
      console.error('Failed to fetch career detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCode) return;
    setSaving(true);
    try {
      await adminCareersApi.update(selectedCode, editData);
      await fetchDetail(selectedCode);
      await fetchCareers();
      setEditMode(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishDraft = async (careerCode: string) => {
    if (publishing) return;
    setPublishing(true);
    try {
      await adminCareersApi.publishDraft(careerCode);
      await fetchDetail(careerCode);
      await fetchCareers();
    } catch (err: any) {
      alert(err.message || 'Failed to publish draft');
    } finally {
      setPublishing(false);
    }
  };

  const handleRejectDraft = async (careerCode: string) => {
    if (rejecting) return;
    setRejecting(true);
    try {
      await adminCareersApi.rejectDraft(careerCode);
      await fetchDetail(careerCode);
      await fetchCareers();
    } catch (err: any) {
      alert(err.message || 'Failed to reject draft');
    } finally {
      setRejecting(false);
    }
  };

  const handleToggleActive = async (careerCode: string) => {
    try {
      await adminCareersApi.toggleActive(careerCode);
      await fetchCareers();
      if (selectedCode === careerCode) {
        await fetchDetail(careerCode);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle');
    }
  };

  const handleBulkPublish = async () => {
    if (!window.confirm('Publish all drafts with backfill_status=ai_refined?')) return;
    setBulkPublishing(true);
    try {
      const res = await adminCareersApi.bulkPublish({ backfill_status: 'ai_refined' });
      alert(res.message);
      await fetchCareers();
    } catch (err: any) {
      alert(err.message || 'Bulk publish failed');
    } finally {
      setBulkPublishing(false);
    }
  };

  const fetchAudit = async () => {
    setAuditLoading(true);
    try {
      const data = await adminCareersApi.importAudit();
      setAuditData(data);
      setActiveTab('audit');
    } catch (err: any) {
      alert(err.message || 'Failed to load audit');
    } finally {
      setAuditLoading(false);
    }
  };

  const renderTraitBar = (value: number, _max = 100) => (
    <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-300"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );

  const renderRadarChart = (weights: Record<string, number> | null | undefined, label: string) => {
    if (!weights) return <div className="text-text-muted/60 text-xs italic">No data</div>;
    return (
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
        {TRAITS.map(trait => (
          <div key={trait} className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted w-24 truncate capitalize">{trait.replace(/_/g, ' ')}</span>
            <div className="flex-1">{renderTraitBar(weights[trait] || 0)}</div>
            <span className="text-[10px] font-mono text-text-muted w-6 text-right">{weights[trait] || 0}</span>
          </div>
        ))}
    </div>
  );
};
  const statusBadge = (status: string | undefined) => {
    const colors: Record<string, string> = {
      rule_based: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ai_refined: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    const s = status || 'rule_based';
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[s] || colors.rule_based}`}>
        {s.replace('_', ' ')}
      </span>
    );
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-6 md:p-8 space-y-8">

        {/* ========== CAREER TABLE TAB ========== */}
        {activeTab === 'table' && (
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">Career Catalog</h1>
                <p className="text-text-muted text-sm mt-1">Manage {pagination.total} careers across all categories</p>
              </div>
              <button onClick={() => fetchCareers()} className="p-2.5 bg-white/[0.03] hover:bg-white/10 border border-white/10 rounded-xl text-text-muted hover:text-white transition-all">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted/60" />
                <input
                  type="text"
                  placeholder="Search career names..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cta placeholder-text-muted/60"
                />
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-text/80 focus:outline-none focus:border-cta">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={backfillFilter} onChange={e => setBackfillFilter(e.target.value)} className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-text/80 focus:outline-none focus:border-cta">
                <option value="">All Status</option>
                <option value="rule_based">Rule Based</option>
                <option value="ai_refined">AI Refined</option>
                <option value="published">Published</option>
              </select>
              <select value={enrichmentFilter} onChange={e => setEnrichmentFilter(e.target.value)} className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-text/80 focus:outline-none focus:border-cta">
                <option value="">All (Enrichment)</option>
                <option value="true">Needs Enrichment</option>
                <option value="false">No Enrichment</option>
              </select>
            </div>

            {/* Bulk actions */}
            <div className="flex gap-3">
              <button onClick={handleBulkPublish} disabled={bulkPublishing} className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs transition-all disabled:opacity-50">
                {bulkPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                <span>Bulk Publish AI Refined</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white/[0.03]/30 border border-white/10/50 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10/50 bg-white/[0.03]/50">
                      <th className="text-left px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Category</th>
                      <th className="text-left px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Sub-domain</th>
                      <th className="text-left px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Active</th>
                      <th className="text-center px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Enrich</th>
                      <th className="text-right px-4 py-3 text-text-muted font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-cta mx-auto" /></td></tr>
                    ) : careers.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-text-muted/60">No careers match the filters.</td></tr>
                    ) : careers.map(c => (
                      <tr key={c.career_code} className="border-b border-white/[0.06] hover:bg-white/10/30 cursor-pointer transition-all" onClick={() => fetchDetail(c.career_code)}>
                        <td className="px-4 py-3 font-bold text-text/80">{c.name}</td>
                        <td className="px-4 py-3 text-text-muted capitalize">{c.category_code?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-text-muted/60">{c.sub_domain_code || '-'}</td>
                        <td className="px-4 py-3">{statusBadge(c.backfill_status)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${c.is_active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {c.is_active !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {c.needs_enrichment ? <AlertTriangle className="h-3.5 w-3.5 text-cta mx-auto" /> : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={e => { e.stopPropagation(); handleToggleActive(c.career_code); }} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${c.is_active !== false ? 'border-white/20 text-text-muted/60 hover:border-red-500/30 hover:text-red-400' : 'border-emerald-700 text-emerald-500 hover:border-emerald-500/30'}`}>
                            {c.is_active !== false ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10/50 bg-white/[0.03]/50">
                  <span className="text-[10px] text-text-muted/60">{pagination.total} total careers</span>
                  <div className="flex items-center gap-2">
                    <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-1.5 rounded-lg bg-white/10 border border-white/20 disabled:opacity-30 text-text-muted hover:text-white transition-all">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[11px] font-bold text-text-muted px-2">{pagination.page} / {pagination.total_pages}</span>
                    <button disabled={pagination.page >= pagination.total_pages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-1.5 rounded-lg bg-white/10 border border-white/20 disabled:opacity-30 text-text-muted hover:text-white transition-all">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
        )}
  </div>
          </div>
        )}

        {/* ========== BACKFILL QUEUE TAB ========== */}
        {activeTab === 'backfill' && (
          <div className="space-y-6 relative z-10">
            <h1 className="text-3xl font-black text-white">Backfill Queue</h1>
            <p className="text-text-muted text-sm">Careers with AI-refined drafts awaiting review and publication</p>
            <BackfillQueueView
              onPublish={handlePublishDraft}
              onReject={handleRejectDraft}
              onView={fetchDetail}
              onBulkPublish={handleBulkPublish}
              bulkPublishing={bulkPublishing}
            />
          </div>
        )}

        {/* ========== IMPORT AUDIT TAB ========== */}
        {activeTab === 'audit' && (
          <div className="space-y-6 relative z-10">
            <h1 className="text-3xl font-black text-white">Import Audit</h1>
            <p className="text-text-muted text-sm">Catalog import statistics and career database health</p>
            {auditLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-cta" /></div>
            ) : auditData ? (
              <ImportAuditView data={auditData} />
            ) : (
              <button onClick={fetchAudit} className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-bold hover:bg-amber-500/20 transition-all">
                Load Audit Data
              </button>
            )}
          </div>
        )}

        {/* ========== NEEDS ENRICHMENT TAB ========== */}
        {activeTab === 'enrichment' && (
          <div className="space-y-6 relative z-10">
            <h1 className="text-3xl font-black text-white">Needs Enrichment</h1>
            <p className="text-text-muted text-sm">Broad-degree leaves that need splitting into specific job titles</p>
            <NeedsEnrichmentView onView={fetchDetail} />
          </div>
        )}

        {/* ========== DETAIL DRAWER ========== */}
        {selectedCode && (
          <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-end z-50 animate-fade-in">
            <div className="w-full max-w-2xl h-full bg-white/[0.03] border-l border-white/10 overflow-y-auto">
              <div className="p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white">{detailCareer?.name || selectedCode}</h2>
                    <span className="text-xs text-text-muted font-mono">{selectedCode}</span>
                  </div>
                  <button onClick={() => { setSelectedCode(null); setDetailCareer(null); }} className="p-1.5 rounded-xl bg-bg border border-white/10 text-text-muted hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {detailLoading ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-cta" /></div>
                ) : detailCareer ? (
                  <>
                    {/* Status & Actions */}
                    <div className="flex flex-wrap gap-2">
                      {statusBadge(detailCareer.backfill_status)}
                      {detailCareer.needs_enrichment && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">Needs Enrichment</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${detailCareer.is_active !== false ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                        {detailCareer.is_active !== false ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {/* Draft actions */}
                    {(detailCareer.trait_weights_draft || detailCareer.eligibility_draft) && (
                      <div className="flex gap-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                        <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                          <p className="text-xs font-bold text-amber-400">Draft awaiting review</p>
                          <div className="flex gap-2">
                            <button onClick={() => handlePublishDraft(selectedCode)} disabled={publishing} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs transition-all disabled:opacity-50">
                              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : <CheckCircle className="h-3.5 w-3.5 inline mr-1" />}{publishing ? 'Publishing...' : 'Publish Draft'}
                            </button>
                            <button onClick={() => handleRejectDraft(selectedCode)} disabled={rejecting} className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-all disabled:opacity-50">
                              {rejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : <X className="h-3.5 w-3.5 inline mr-1" />}{rejecting ? 'Rejecting...' : 'Reject Draft'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Side-by-side trait comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-bg/50 border border-white/10/50 rounded-2xl">
                      {renderRadarChart(detailCareer.live_trait_weights, 'Live Trait Weights')}
                      {renderRadarChart(detailCareer.draft_trait_weights, 'Draft Trait Weights')}
                    </div>

                    {/* Eligibility */}
                    <div className="grid grid-cols-2 gap-4 p-5 bg-bg/50 border border-white/10/50 rounded-2xl">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live Eligibility</span>
                        {detailCareer.live_eligibility ? (
                          <div className="mt-2 space-y-1">
                            {Object.entries(detailCareer.live_eligibility).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-[10px]">
                                <span className="text-text-muted/60">{k.replace(/_/g, ' ')}</span>
                                <span className="text-text/80 font-mono">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-text-muted/60 italic mt-2">Not set</p>}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Draft Eligibility</span>
                        {detailCareer.draft_eligibility ? (
                          <div className="mt-2 space-y-1">
                            {Object.entries(detailCareer.draft_eligibility).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-[10px]">
                                <span className="text-text-muted/60">{k.replace(/_/g, ' ')}</span>
                                <span className="text-text/80 font-mono">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-text-muted/60 italic mt-2">Not set</p>}
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-4 bg-bg/30 border border-white/[0.06] rounded-2xl text-[10px] space-y-1.5">
                      <div className="flex justify-between"><span className="text-text-muted/60">Category:</span><span className="text-text/80">{detailCareer.category_code}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted/60">Sub-domain:</span><span className="text-text/80">{detailCareer.sub_domain_code || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted/60">Pathway tags:</span><span className="text-text/80">{(detailCareer.pathway_tags || []).join(', ') || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted/60">Catalog parts:</span><span className="text-text/80">{(detailCareer.source_catalog_parts || []).join(', ') || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-text-muted/60">Imported at:</span><span className="text-text/80">{detailCareer.imported_at ? formatDateTime(detailCareer.imported_at) : 'N/A'}</span></div>
                    </div>

                    {/* Inline Edit */}
                    {editMode ? (
                      <div className="space-y-4 p-5 bg-bg/50 border border-white/10/50 rounded-2xl">
                        <span className="text-xs font-bold text-amber-400">Editing: {selectedCode}</span>
                        <textarea
                          value={JSON.stringify(editData, null, 2)}
                          onChange={e => { try { setEditData(JSON.parse(e.target.value)); } catch {} }}
                          className="w-full h-64 bg-white/[0.03] border border-white/20 rounded-xl p-3 text-xs font-mono text-text/80 focus:outline-none focus:border-cta"
                        />
                        <div className="flex gap-2">
                          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-xl text-xs hover:bg-amber-500/30 transition-all disabled:opacity-50">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : null} Save
                          </button>
                          <button onClick={() => setEditMode(false)} className="px-4 py-2 bg-white/10 border border-white/20 text-text-muted font-bold rounded-xl text-xs hover:text-white transition-all">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditData(detailCareer); setEditMode(true); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 hover:border-cta/30 text-text-muted hover:text-amber-400 font-bold rounded-xl text-xs transition-all">
                        <Sliders className="h-3.5 w-3.5 inline mr-1.5" />Edit Career Data
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-text-muted/60 text-center py-8">Career not found</p>
                )}
              </div>
            </div>
          </div>
        )}
  </motion.div>
  );
};

// ========== Sub-components ==========

const BackfillQueueView: React.FC<{
  onPublish: (code: string) => void;
  onReject: (code: string) => void;
  onView: (code: string) => void;
  onBulkPublish: () => void;
  bulkPublishing: boolean;
}> = ({ onPublish, onReject, onView, onBulkPublish, bulkPublishing }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminCareersApi.list({ backfill_status: 'ai_refined', limit: 200, sort_by: 'name', sort_order: 'asc' });
        setQueue(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-cta" /></div>;
  if (queue.length === 0) return <div className="p-8 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl text-center"><CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" /><p className="text-text-muted text-sm">No careers awaiting review. All drafts have been handled.</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{queue.length} careers awaiting review</span>
        <button onClick={onBulkPublish} disabled={bulkPublishing} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs transition-all disabled:opacity-50">
          {bulkPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : <CheckCircle className="h-3.5 w-3.5 inline mr-1" />}
          Bulk Publish All
        </button>
      </div>
      {queue.map(c => (
        <div key={c.career_code} className="p-4 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => onView(c.career_code)}>
          <div>
            <p className="text-sm font-bold text-text/80">{c.name}</p>
            <p className="text-[10px] text-text-muted/60 font-mono">{c.career_code} · {c.category_code}</p>
          </div>
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => onPublish(c.career_code)} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg text-[10px] transition-all">
              Publish
            </button>
            <button onClick={() => onReject(c.career_code)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-[10px] transition-all">
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const ImportAuditView: React.FC<{ data: any }> = ({ data }) => (
  <div className="space-y-6">
    {/* Summary cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-5 bg-white/[0.03] border border-white/10/50 rounded-2xl">
        <FileText className="h-5 w-5 text-accent mb-2" />
        <p className="text-2xl font-black text-white">{data.total_careers}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Careers</p>
      </div>
      <div className="p-5 bg-white/[0.03] border border-white/10/50 rounded-2xl">
        <Sparkles className="h-5 w-5 text-amber-400 mb-2" />
        <p className="text-2xl font-black text-white">{data.backfill_awaiting_review}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Awaiting Review</p>
      </div>
      <div className="p-5 bg-white/[0.03] border border-white/10/50 rounded-2xl">
        <AlertTriangle className="h-5 w-5 text-cta mb-2" />
        <p className="text-2xl font-black text-white">{data.needs_enrichment_count}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Needs Enrichment</p>
      </div>
      <div className="p-5 bg-white/[0.03] border border-white/10/50 rounded-2xl">
        <Layers className="h-5 w-5 text-emerald-400 mb-2" />
        <p className="text-2xl font-black text-white">{data.catalog_parts?.length || 0}</p>
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Catalog Sources</p>
      </div>
    </div>

    {/* By category */}
    <div className="p-5 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl">
      <h3 className="text-sm font-bold text-white mb-4">Careers by Category</h3>
      <div className="space-y-2">
        {data.by_category?.map((cat: any) => (
          <div key={cat._id} className="flex items-center gap-3">
            <span className="text-xs text-text/80 w-32 capitalize truncate">{cat._id?.replace(/_/g, ' ')}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-accent-2 rounded-full" style={{ width: `${(cat.count / (data.total_careers || 1)) * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-text-muted w-10 text-right">{cat.count}</span>
          </div>
        ))}
      </div>
    </div>

    {/* By backfill status */}
    <div className="p-5 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl">
      <h3 className="text-sm font-bold text-white mb-4">Backfill Status Distribution</h3>
      <div className="grid grid-cols-3 gap-4">
        {data.by_backfill_status?.map((s: any) => (
          <div key={s._id} className="p-4 bg-bg/50 border border-white/[0.06] rounded-xl text-center">
            <p className="text-lg font-black text-white">{s.count}</p>
            <p className="text-[10px] text-text-muted capitalize">{s._id?.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Catalog parts */}
    <div className="p-5 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl">
      <h3 className="text-sm font-bold text-white mb-4">Catalog Sources</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.catalog_parts?.map((p: any) => (
          <div key={p.part} className="p-3 bg-bg/50 border border-white/[0.06] rounded-xl">
            <p className="text-xs font-bold text-text/80">{p.name}</p>
            <p className="text-[10px] text-text-muted/60 font-mono">{p.part}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NeedsEnrichmentView: React.FC<{ onView: (code: string) => void }> = ({ onView }) => {
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminCareersApi.list({ needs_enrichment: 'true', limit: 200 });
        setCareers(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-cta" /></div>;
  if (careers.length === 0) return <div className="p-8 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl text-center"><CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-3" /><p className="text-text-muted text-sm">No careers flagged for enrichment.</p></div>;

  return (
    <div className="space-y-3">
      <span className="text-xs text-text-muted">{careers.length} careers flagged</span>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {careers.map(c => (
          <div key={c.career_code} onClick={() => onView(c.career_code)} className="p-4 bg-white/[0.03]/30 border border-white/10/50 rounded-2xl cursor-pointer hover:bg-white/[0.04] transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-text/80">{c.name}</p>
                <p className="text-[10px] text-text-muted/60">{c.category_code} · {c.sub_domain_code || '-'}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-cta shrink-0" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(c.pathway_tags || []).slice(0, 3).map((t: string) => (
                <span key={t} className="text-[9px] bg-bg border border-white/10 text-text-muted px-1.5 py-0.5 rounded">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
