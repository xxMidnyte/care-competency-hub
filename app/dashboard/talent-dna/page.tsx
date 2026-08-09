"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getRecommendedTrack } from '@/lib/talent-dna-utils';
import { 
  Users, 
  UserCircle2, 
  ArrowRight, 
  Dna, 
  ClipboardCheck, 
  ChevronRight,
  Loader2
} from 'lucide-react';

// --- MOCK DATA FOR THE MANAGER VIEW ---
const mockStaff = [
  { id: "1", name: "Sarah Miller", role: "CNA", top5: ["Clinical Precision", "Risk Mitigator", "Data Validator", "Staff Mentor", "Consistent Producer"] },
  { id: "2", name: "John Doe", role: "LPN", top5: ["Direct Leader", "Momentum Builder", "Performance Driver", "Legacy Maker", "Shift Coordinator"] },
];

export default function TalentDNAMainPage() {
  const [role, setRole] = useState<string | null>(null);
  const [hasCompletedDna, setHasCompletedDna] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, dnaRes] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("talent_dna_results").select("id").eq("user_id", user.id).limit(1)
      ]);

      if (profileRes.data) setRole(profileRes.data.role);
      setHasCompletedDna(!!dnaRes.data && dnaRes.data.length > 0);
      setLoading(false);
    }
    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // --- VIEW 1: MANAGER/ADMIN VIEW (The Table) ---
  if (role === 'admin' || role === 'manager') {
    return (
      <div className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Track Recommendations</h1>
            <p className="text-foreground/60 text-sm">Automated developmental track matching based on Talent DNA.</p>
          </div>
          <Link 
            href="/dashboard/talent-dna/quiz"
            className="flex items-center gap-2 bg-indigo-600 text-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Dna size={18} /> Take My Own Assessment
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-muted border-b border-border text-[11px] uppercase font-bold text-foreground/60 tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Top 5 Themes</th>
                <th className="px-6 py-4">Recommended Track</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockStaff.map((staff) => {
                const rec = getRecommendedTrack(staff.top5);
                return (
                  <tr key={staff.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{staff.name}</div>
                      <div className="text-[10px] text-foreground/60 font-medium uppercase">{staff.role}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                        {staff.top5.map((t) => (
                          <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded font-medium text-foreground/65 border border-border">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${rec.bgColor} ${rec.color} border border-current/10`}>
                        {rec.trackName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 text-xs font-bold hover:underline">
                        Assign Track
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- VIEW 2: STAFF VIEW (Welcome/Summary) ---
  return (
    <div className="max-w-4xl mx-auto p-8 py-16 text-center">
      <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
        <Dna size={40} />
      </div>
      <h1 className="text-4xl font-black text-foreground mb-4 tracking-tight">Clinical Talent DNA</h1>
      <p className="text-foreground/60 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
        Understand your natural clinical instincts and unlock a personalized professional development track.
      </p>

      <div className="grid md:grid-cols-2 gap-6 text-left mb-12">
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <ClipboardCheck size={20} />
          </div>
          <h3 className="font-bold text-foreground mb-2">The Assessment</h3>
          <p className="text-sm text-foreground/60">A 177-question psychometric tool specifically designed for healthcare professionals.</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <UserCircle2 size={20} />
          </div>
          <h3 className="font-bold text-foreground mb-2">Growth Tracks</h3>
          <p className="text-sm text-foreground/60">Automatically get matched to Leadership, Mentorship, or Clinical Excellence pathways.</p>
        </div>
      </div>

      <Link 
        href={hasCompletedDna ? "/dashboard/talent-dna/results" : "/dashboard/talent-dna/quiz"}
        className="inline-flex items-center gap-2 bg-card text-foreground px-8 py-4 rounded-2xl font-bold hover:bg-card-2 transition-all group shadow-xl shadow-slate-200"
      >
        {hasCompletedDna ? "View My Results" : "Start My Assessment"}
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}