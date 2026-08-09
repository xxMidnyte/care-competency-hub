"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useOrg } from "@/hooks/useOrg";

type Facility = {
  id: string;
  name: string | null;
};

type Policy = {
  id: string;
  org_id: string;
  facility_id: string | null;
  title: string;
  description: string | null;
  category: string;
  file_url: string;
  tags: string[];
  version_number: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  source_batch_id?: string;
};

const CATEGORY_OPTIONS = ["All", "HR", "Clinical", "Safety", "Emergency", "Infection Control", "Administrative", "Other"];

// UI Constants
const card = "rounded-2xl border border-border bg-card shadow-card";
const cardInner = "p-4";
const label = "text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/60";
const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50";
const select = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50";
const chip = "rounded-full bg-muted px-2 py-1 text-[11px] text-foreground/70";
const btnPrimary = "inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90";
const btnSoft = "inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-card transition hover:bg-muted";
const btnDangerSoft = "inline-flex items-center justify-center rounded-full border border-red-500/20 bg-background px-4 py-2 text-sm font-semibold text-red-500 shadow-card transition hover:bg-red-500/5";

export default function PoliciesPage() {
  const { loading: orgLoading, org, organizationId } = useOrg();
  const userRole = org?.role ?? "staff";
  const hasModuleAccess = org?.isDevOrg || org?.featureFlags?.has_policy_module;
  const canManagePolicies = ["dev", "admin", "manager"].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  const [selectedFacilityId, setSelectedFacilityId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  
  // Bulk Ingest State
  const [isIngesting, setIsIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stagedPolicies, setStagedPolicies] = useState<any[]>([]);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  const facilityNameMap = useMemo(() => {
    return facilities.reduce((acc, f) => {
      if (f.id) acc[f.id] = f.name || "Unnamed facility";
      return acc;
    }, {} as Record<string, string>);
  }, [facilities]);

  useEffect(() => {
    async function load() {
      if (orgLoading) return;
      try {
        setLoading(true);
        if (!organizationId || !hasModuleAccess) return;

        const { data: facs } = await supabase.from("facilities").select("id, name").eq("org_id", organizationId).order("name");
        setFacilities(facs ?? []);
        await fetchPolicies(organizationId);
      } catch (err) {
        setError("Failed to load initial data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgLoading, organizationId, hasModuleAccess]);

  async function fetchPolicies(oid: string, opts?: any) {
    setLoadingPolicies(true);
    const params = new URLSearchParams({ orgId: oid });
    if (opts?.facilityId && opts.facilityId !== "all") params.set("facilityId", opts.facilityId);
    if (opts?.category && opts.category !== "All") params.set("category", opts.category);
    if (opts?.search) params.set("q", opts.search);
    if (opts?.includeArchived) params.set("includeArchived", "true");

    const res = await fetch(`/api/policies?${params.toString()}`);
    const body = await res.json();
    setPolicies(body.policies ?? []);
    setLoadingPolicies(false);
  }

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] || "");
    reader.onerror = reject;
  });

  async function handleBulkUpload(file: File) {
    try {
      setIsIngesting(true);
      setProgress(5);
      const fileBase64 = await toBase64(file);
      
      const { data: batch } = await supabase.from("policy_ingest_batches")
        .insert([{ org_id: organizationId, original_filename: file.name, status: 'processing' }])
        .select().single();

      if (!batch) throw new Error("Could not create batch.");
      setCurrentBatchId(batch.id);

      // Process first batch
      const { data: initialData, error: initialFnError } = await supabase.functions.invoke("quick-function", {
        body: { fileBase64, orgId: organizationId, batchId: batch.id, startIdx: 0 },
      });
      if (initialFnError) throw initialFnError;
      const { policies: initialPolicies, totalChunksFound } = initialData;
      setStagedPolicies(initialPolicies);

      // Recursive Loop for remaining batches
      const totalBatches = Math.ceil(totalChunksFound / 8);
      let currentIdx = 8;
      let batchesDone = 1;

      while (currentIdx < totalChunksFound) {
        const { data: nextBatch, error: nextFnError } = await supabase.functions.invoke("quick-function", {
          body: { fileBase64, orgId: organizationId, batchId: batch.id, startIdx: currentIdx },
        });
        if (nextFnError) throw nextFnError;
        setStagedPolicies(prev => [...prev, ...nextBatch.policies]);
        batchesDone++;
        setProgress(Math.round((batchesDone / totalBatches) * 100));
        currentIdx += 8;
      }
      setProgress(100);
      setTimeout(() => setProgress(0), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsIngesting(false);
    }
  }

  async function saveStagedPolicy(index: number) {
    const p = stagedPolicies[index];
    const { error: saveError } = await supabase.from("policies").insert([{
      org_id: organizationId,
      title: p.title,
      description: p.description,
      category: p.category,
      tags: p.tags,
      source_batch_id: currentBatchId,
      file_url: "processing"
    }]);

    if (!saveError) {
      setStagedPolicies(prev => prev.filter((_, i) => i !== index));
      fetchPolicies(organizationId!);
    }
  }

  if (loading || orgLoading) return <div className="p-6 text-sm opacity-60">Loading...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Policies</h1>
            <p className="text-sm text-foreground/60">Organization library and compliance tools.</p>
          </div>
          <div className="flex gap-2">
            {canManagePolicies && (
              <>
                <button onClick={() => document.getElementById('bulk-ingest')?.click()} className={btnSoft} disabled={isIngesting}>
                  {isIngesting ? "🧠 AI Ingesting..." : "🚀 Bulk Ingest"}
                </button>
                <input id="bulk-ingest" type="file" hidden accept=".pdf" onChange={(e) => e.target.files?.[0] && handleBulkUpload(e.target.files[0])} />
                <Link href="/dashboard/policies/new" className={btnPrimary}>＋ Add policy</Link>
              </>
            )}
          </div>
        </div>

        {/* PROGRESS BAR */}
        {isIngesting && (
          <div className="space-y-2 animate-in fade-in duration-500">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>Shredding Handbook...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* STAGING AREA */}
        {stagedPolicies.length > 0 && (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider">AI Suggestions ({stagedPolicies.length})</h2>
              <button onClick={() => setStagedPolicies([])} className="text-xs opacity-50 hover:opacity-100">Clear All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stagedPolicies.map((p, i) => (
                <div key={i} className={`${card} p-4 flex flex-col`}>
                  <input className={input + " mb-2 font-bold"} defaultValue={p.title} onBlur={(e) => stagedPolicies[i].title = e.target.value} />
                  <textarea className={input + " text-xs h-16 resize-none mb-3"} defaultValue={p.description} onBlur={(e) => stagedPolicies[i].description = e.target.value} />
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex gap-1">
                        {p.tags?.slice(0, 2).map((t: string) => <span key={t} className={chip}>{t}</span>)}
                    </div>
                    <button onClick={() => saveStagedPolicy(i)} className={btnPrimary + " py-1 px-3 text-xs"}>Confirm</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILTERS */}
        <form className={`${card} ${cardInner} flex flex-wrap items-end gap-3`} onSubmit={(e) => {
            e.preventDefault();
            fetchPolicies(organizationId!, { facilityId: selectedFacilityId, category: selectedCategory, search, includeArchived });
        }}>
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className={label}>Search</label>
            <input type="text" className={input} placeholder="Search title, keywords, or tags..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-48 space-y-1">
            <label className={label}>Category</label>
            <select className={select} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className={btnSoft} disabled={loadingPolicies}>{loadingPolicies ? "..." : "Filter"}</button>
        </form>

        {/* LIST */}
        <div className={card}>
          <div className="border-b border-border px-4 py-3 text-xs font-bold uppercase tracking-widest opacity-60">Library</div>
          <ul className="divide-y divide-border">
            {policies.length === 0 ? <li className="p-8 text-center text-sm opacity-50">No policies found.</li> : 
              policies.map((p) => (
              <li key={p.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Link href={`/dashboard/policies/${p.id}`} className="font-semibold hover:text-primary transition-colors">{p.title}</Link>
                    <p className="text-xs text-foreground/60 line-clamp-1">{p.description}</p>
                    <div className="flex gap-1 mt-2">
                        {p.tags?.map(t => <span key={t} className="text-[10px] text-primary/70">#{t}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {p.file_url === "processing" ? (
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-full animate-pulse font-bold">SHREDDING...</span>
                    ) : (
                      <a href={p.file_url} target="_blank" className={btnSoft + " py-1 text-xs"}>View PDF</a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}