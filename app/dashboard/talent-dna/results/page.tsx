"use client";

import { useEffect, useState, useMemo } from 'react';
import { Award, Zap, ArrowRight, Loader2, Printer, BarChart3, Activity, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LabelList, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { supabase } from '@/lib/supabaseClient'; 
import { getRecommendedTrack, getPowerPairing } from '@/lib/talent-dna-utils';
import { TALENT_THEMES } from '@/lib/talentData'; 
import DevelopmentPlan from '@/components/DevelopmentPlan';

const DOMAIN_MAP: Record<string, { domain: string; color: string; border: string; hex: string; definition: string; love: string; dislike: string }> = {
  "Consistent Producer": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Turning ideas into reality and ensuring precision in clinical tasks.", love: "Reliability", dislike: "Laziness" },
  "Shift Coordinator": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Ensuring smooth clinical flow and operational excellence.", love: "Efficiency", dislike: "Disruption" },
  "Mission-Driven": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Operating with a deep sense of purpose and clinical values.", love: "Purpose", dislike: "Apathy" },
  "Standardized Care": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Maintaining high standards through process and consistency.", love: "Structure", dislike: "Guesswork" },
  "Risk Mitigator": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Identifying and neutralizing potential clinical safety issues.", love: "Safety", dislike: "Recklessness" },
  "Clinical Precision": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Focused on accuracy and technical mastery in practice.", love: "Accuracy", dislike: "Errors" },
  "Target-Oriented": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Driven to meet and exceed clinical performance benchmarks.", love: "Results", dislike: "Stagnation" },
  "Ultimate Owner": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Taking full responsibility for outcomes and follow-through.", love: "Commitment", dislike: "Excuses" },
  "Crisis Fixer": { domain: "Executing", color: "bg-purple-500", border: "border-purple-200", hex: "#a855f7", definition: "Thriving in high-pressure environments to restore order.", love: "Resolution", dislike: "Panic" },
  "Momentum Builder": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Energizing the team and building excitement.", love: "Energy", dislike: "Pessimism" },
  "Direct Leader": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Providing clear direction and taking charge of team results.", love: "Clarity", dislike: "Indecision" },
  "Staff Storyteller": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Using communication to inspire and align the clinical staff.", love: "Engagement", dislike: "Silence" },
  "Performance Driver": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Pushing self and others to reach higher levels of excellence.", love: "Growth", dislike: "Mediocrity" },
  "Excellence Seeker": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Obsessed with quality and raising the bar of clinical care.", love: "Quality", dislike: "Corner-cutting" },
  "Confident Clinician": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Projecting certainty and expertise in decision-making.", love: "Certainty", dislike: "Self-doubt" },
  "Legacy Maker": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Focused on making a long-term impact on the organization.", love: "Impact", dislike: "Short-termism" },
  "Community Connector": { domain: "Influencing", color: "bg-orange-500", border: "border-orange-200", hex: "#f97316", definition: "Building external relationships and visibility.", love: "Networking", dislike: "Isolation" },
  "Fluid Responder": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Adapting naturally to the changing needs of the team.", love: "Flexibility", dislike: "Rigidity" },
  "Holistic Thinker": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Seeing the person behind the patient and the staff.", love: "Empathy", dislike: "Coldness" },
  "Staff Mentor": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Investing in the growth and development of colleagues.", love: "Potential", dislike: "Neglect" },
  "Compassionate Sensor": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Picking up on the emotional needs of patients and peers.", love: "Support", dislike: "Hardness" },
  "Peace Mediator": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Resolving conflict and maintaining team harmony.", love: "Harmony", dislike: "Drama" },
  "Team Integrator": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Bringing diverse people together for a common cause.", love: "Inclusion", dislike: "Cliques" },
  "Person-Centered": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Focusing on individual uniqueness to drive engagement.", love: "Unique Fits", dislike: "Stereotypes" },
  "Morale Booster": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Providing emotional support during hard shifts.", love: "Positivity", dislike: "Toxicity" },
  "Direct Confidant": { domain: "Relationship", color: "bg-blue-500", border: "border-blue-200", hex: "#3b82f6", definition: "Building deep trust and psychological safety.", love: "Trust", dislike: "Betrayal" },
  "Data Validator": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Analyzing data and planning for future care outcomes.", love: "Evidence", dislike: "Assumptions" },
  "Historical Expert": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Using past experiences to guide current choices.", love: "Context", dislike: "Redundancy" },
  "Future-Care Visionary": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Anticipating future trends in healthcare.", love: "Innovation", dislike: "The Status Quo" },
  "Creative Strategist": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Developing innovative solutions to complex floor issues.", love: "Options", dislike: "Dead-ends" },
  "Resource Collector": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Gathering knowledge and tools needed for success.", love: "Learning", dislike: "Empty Hands" },
  "Deep Contemplator": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Taking time to think through implications of decisions.", love: "Refinement", dislike: "Rushing" },
  "Clinical Scholar": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Driven by learning and evidence-based practice updates.", love: "Mastery", dislike: "Ignorance" },
  "Pathway Mapper": { domain: "Strategic", color: "bg-emerald-500", border: "border-emerald-200", hex: "#10b981", definition: "Designing the step-by-step route to reach goals.", love: "Planning", dislike: "Aimlessness" },
};

export default function ResultsDashboard() {
  const [rawScores, setRawScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('talent_dna_results')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (data?.raw_scores_json) {
        setRawScores(data.raw_scores_json as Record<string, number>);
      }
      setLoading(false);
    }
    fetchResults();
  }, []);

  // Use Memo to process all UI data once rawScores are available
  const processedData = useMemo(() => {
    if (Object.keys(rawScores).length === 0) return null;

    const baseSorted = Object.entries(rawScores)
      .filter(([theme]) => TALENT_THEMES.includes(theme))
      .sort(([, a], [, b]) => b - a) as [string, number][];

    const top5 = baseSorted.slice(0, 5);
    const top5Names = top5.map(([name]) => name);
    const domains = ["Strategic", "Influencing", "Relationship", "Executing"];

    const dnaChartData = domains.flatMap(domain => 
      baseSorted
        .filter(([name]) => DOMAIN_MAP[name]?.domain === domain)
        .map(([name, score]) => ({
          subject: name,
          intensity: score,
          domain: domain,
          fullValue: score,
          color: DOMAIN_MAP[name]?.hex || "#cbd5e1"
        }))
    );

    const domainStats = domains.map(d => ({
      name: d,
      value: baseSorted.slice(0, 10).filter(([name]) => DOMAIN_MAP[name]?.domain === d).length,
      color: Object.values(DOMAIN_MAP).find(v => v.domain === d)?.hex || "#64748b"
    })).filter(d => d.value > 0);

    return {
      allTalentsSorted: baseSorted,
      top5,
      top5Names,
      dnaChartData,
      domainStats,
      recommendation: getRecommendedTrack(top5Names),
      powerPairing: getPowerPairing(top5Names)
    };
  }, [rawScores]);

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Decoding DNA...</p>
    </div>
  );

  if (!processedData) return <div className="p-20 text-center">No DNA data found.</div>;

  const { allTalentsSorted, top5, dnaChartData, domainStats, recommendation, powerPairing } = processedData;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-white min-h-screen print:p-0">
      
      <header className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6 no-print">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-100">
            Assessment Complete
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Your Talent DNA Profile</h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Your unique clinical fingerprint based on your natural recurring patterns of behavior.
          </p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg">
          <Printer size={16} /> Print Full Report
        </button>
      </header>

      {/* Top 5 Hero Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12 print-break-avoid">
        {top5.map(([name], index) => (
          <div key={name} className={`relative p-6 rounded-2xl border-2 text-center transition-all ${
            index === 0 ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className={`mx-auto w-10 h-10 rounded-full mb-3 flex items-center justify-center ${index === 0 ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>
              {index === 0 ? <Award size={20} /> : <Zap size={20} />}
            </div>
            <p className="text-[9px] uppercase font-black tracking-widest mb-1 opacity-60">Theme {index + 1}</p>
            <h3 className="font-black text-[11px] leading-tight uppercase">{name}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Talent Sequence Table */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-indigo-600" size={20} />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Full Talent Sequence</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-8 py-4 w-16">#</th>
                    <th className="px-4 py-4">Theme</th>
                    <th className="px-4 py-4 hidden md:table-cell">I Love</th>
                    <th className="px-4 py-4 hidden md:table-cell">I Dislike</th>
                    <th className="px-8 py-4 text-right">Intensity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allTalentsSorted.map(([theme, score], index) => (
                    <tr key={theme} className={`hover:bg-slate-50/80 transition-colors ${index < 5 ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-8 py-4 text-[10px] font-black text-slate-300">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DOMAIN_MAP[theme]?.hex || '#cbd5e1' }} />
                          <span className={`text-sm font-bold ${index < 5 ? 'text-indigo-600' : 'text-slate-800'}`}>{theme}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-emerald-700 font-medium italic hidden md:table-cell">{DOMAIN_MAP[theme]?.love || 'N/A'}</td>
                      <td className="px-4 py-4 text-xs text-rose-600 font-medium italic hidden md:table-cell">{DOMAIN_MAP[theme]?.dislike || 'N/A'}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="w-24 h-2 bg-slate-100 rounded-full inline-block overflow-hidden relative border border-slate-200">
                          <div 
                            className={`h-full absolute left-0 top-0 ${index < 5 ? 'bg-indigo-500' : 'bg-slate-300'}`} 
                            style={{ width: `${(score / (allTalentsSorted[0]?.[1] || 1)) * 100}%` }} 
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Insights & Plan */}
        <div className="lg:col-span-4 space-y-6">
          {recommendation && (
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl border-t-4 border-indigo-500 print-break-avoid">
              <p className="text-indigo-400 text-[10px] font-black uppercase mb-2 tracking-widest">Growth Pathway</p>
              <h3 className="text-2xl font-black mb-4 leading-tight">{recommendation?.trackName}</h3>
              <p className="text-slate-400 text-sm mb-6 italic leading-relaxed">
                "Your {top5[0]?.[0]} drive suggests a natural mastery for this trajectory."
              </p>
              <button className="no-print w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all">
                Accept Track <ArrowRight size={16} />
              </button>
            </div>
          )}

          {powerPairing && (
            <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100 shadow-sm relative overflow-hidden group print-break-avoid">
              <div className="absolute -right-4 -top-4 text-indigo-100/50 rotate-12 transition-transform group-hover:scale-110">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-white border border-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-4">
                  Unique Synergy
                </div>
                <h4 className="text-xl font-black text-slate-900 leading-tight mb-3">
                  {powerPairing.title}
                </h4>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold px-2 py-1 bg-indigo-600 text-white rounded-lg">{top5[0]?.[0]}</span>
                  <span className="text-slate-400 font-black">+</span>
                  <span className="text-[10px] font-bold px-2 py-1 bg-white border border-indigo-200 text-indigo-600 rounded-lg">{top5[1]?.[0]}</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                  {powerPairing.insight}
                </p>
              </div>
            </div>
          )}

          <DevelopmentPlan trackName={recommendation?.trackName || ''} />

          {/* Domain Intensity Chart */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm print-break-avoid">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-6 text-center">Domain Intensity</h4>
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={domainStats}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {domainStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry?.color || '#cbd5e1'} stroke="#fff" strokeWidth={2} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="inside" 
                      fill="#fff" 
                      fontSize={10} 
                      fontWeight="900" 
                      formatter={(val: any) => `${Number(val) * 10}%`} 
                    />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {domainStats.map((domain) => (
                <div key={domain.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: domain.color }} />
                    <span className="text-[9px] font-black uppercase text-slate-600">{domain.name}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-slate-400">{domain.value * 10}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Radar Map Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm print:break-before-page overflow-visible relative mb-12">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <Activity className="text-indigo-600" size={28} />
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Full Talent DNA Map</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">360° View of Clinical Strengths</p>
            </div>
          </div>
        </div>

        <div className="w-full h-[600px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={dnaChartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={({ x, y, payload }) => {
                  const isTop5 = top5.some(([name]) => name === payload.value);
                  const fill = isTop5 ? (DOMAIN_MAP[payload.value]?.hex || "#4f46e5") : "#94a3b8";
                  return (
                    <text x={x} y={y} fill={fill} fontSize={isTop5 ? "11px" : "8px"} fontWeight={isTop5 ? "900" : "500"} textAnchor="middle" className="uppercase tracking-tighter">
                      {payload.value}
                    </text>
                  );
                }} 
              />
              <Radar
                name="Talent Intensity"
                dataKey="fullValue"
                stroke="#6366f1"
                strokeWidth={0.5}
                fill="#6366f1"
                fillOpacity={0.03}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isTop5 = top5.some(([name]) => name === payload.subject);
                  if (!isTop5) return null; // Only render the "lines" for Top 5
                  return (
                    <line 
                      x1="50%" y1="50%" 
                      x2={cx} y2={cy} 
                      stroke={payload?.color || '#cbd5e1'} 
                      strokeWidth="5" 
                      style={{ opacity: 1 }} 
                    />
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}