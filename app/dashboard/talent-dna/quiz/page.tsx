"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";
import { FORCED_CHOICE_QUESTIONS, TALENT_THEMES } from "@/lib/talentData";
import { Loader2, BrainCircuit, Timer, Zap, AlertCircle, Save } from 'lucide-react';

export default function TalentDNAQuiz() {
  const router = useRouter();
  
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({}); 
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);

  // --- PERSISTENCE: Check for existing results first ---
  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('talent_dna_results')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // If they already finished, don't make them do it again
      if (data) router.push('/dashboard/talent-dna/results');
    }
    checkExisting();

    const saved = localStorage.getItem('talent_dna_progress');
    if (saved) {
      const { index, savedAnswers } = JSON.parse(saved);
      setCurrentIndex(index);
      setAnswers(savedAnswers);
      setQuizStarted(true);
    }
  }, [router]);

  // --- PERSISTENCE: Save Progress ---
  useEffect(() => {
    if (quizStarted) {
      localStorage.setItem('talent_dna_progress', JSON.stringify({
        index: currentIndex,
        savedAnswers: answers
      }));
    }
  }, [currentIndex, answers, quizStarted]);

  // --- TIMER ---
  useEffect(() => {
    if (!quizStarted || submitting || error) return;
    if (timeLeft <= 0) {
      handleChoice(FORCED_CHOICE_QUESTIONS[currentIndex].optionA.theme);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizStarted, submitting, error, currentIndex]);

  const handleChoice = (selectedTheme: string) => {
    const newAnswers = { ...answers, [FORCED_CHOICE_QUESTIONS[currentIndex].id]: selectedTheme };
    setAnswers(newAnswers);
    
    if (currentIndex < FORCED_CHOICE_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(20);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: Record<number, string>) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please log in.");

      // Tally points
      const tallies: Record<string, number> = {};
      TALENT_THEMES.forEach(t => tallies[t] = 0);
      Object.values(finalAnswers).forEach((theme) => {
        if (tallies.hasOwnProperty(theme)) tallies[theme] += 1;
      });

      // Sort for Top 5
      const top5 = Object.entries(tallies)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme);

      // Save to Supabase (using the new completed_at column)
      const { error: dbError } = await supabase
        .from('talent_dna_results')
        .upsert({
          user_id: user.id,
          raw_scores_json: tallies,
          top_5_themes: top5,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (dbError) throw dbError;

      localStorage.removeItem('talent_dna_progress');
      router.push('/dashboard/talent-dna/results');

    } catch (err: any) {
      setError(err.message || "Final save failed.");
      setSubmitting(false);
    }
  };

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700">
        <div className="inline-flex p-5 bg-indigo-50 text-indigo-600 rounded-[2.5rem] mb-8 shadow-inner">
          <BrainCircuit size={64} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-6 leading-tight tracking-tight">Identify Your Talent DNA</h1>
        <p className="text-slate-500 mb-12 text-xl leading-relaxed">
          Choose the statement that describes you best. Don't overthink—trust your autopilot.
        </p>
        <button 
          onClick={() => setQuizStarted(true)}
          className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          Begin Full Assessment
        </button>
      </div>
    );
  }

  const currentQ = FORCED_CHOICE_QUESTIONS[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Premium Header */}
      <div className="p-6 flex justify-between items-center bg-white border-b border-slate-100 shadow-sm">
        <div className={`px-4 py-2 rounded-xl font-mono font-bold border transition-all flex items-center gap-2 ${
          timeLeft < 5 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'
        }`}>
          <Timer size={16} />
          0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>
        <div className="text-center flex-1 mx-12">
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-indigo-600 transition-all duration-700 ease-out" 
              style={{ width: `${((currentIndex + 1) / FORCED_CHOICE_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="font-black text-slate-900 tracking-tighter text-lg">
          {currentIndex + 1} <span className="text-slate-200">/ {FORCED_CHOICE_QUESTIONS.length}</span>
        </div>
      </div>

      {/* Main Choice Area */}
      <div className="flex-1 max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-8 p-8 items-center relative">
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white border-4 border-slate-50 rounded-full items-center justify-center z-10 shadow-lg group">
          <span className="text-slate-300 font-black text-xs group-hover:text-indigo-500 transition-colors">OR</span>
        </div>

        {/* Option A */}
        <button
          onClick={() => handleChoice(currentQ.optionA.theme)}
          className="group relative h-[400px] bg-white border-2 border-slate-100 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-indigo-500 hover:shadow-[0_32px_64px_-12px_rgba(79,70,229,0.15)] active:scale-95"
        >
          <div className="absolute top-8 left-8 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <span className="text-slate-300 group-hover:text-indigo-600 font-black text-sm">A</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-800 group-hover:text-indigo-950 leading-tight max-w-sm">
            {currentQ.optionA.text}
          </p>
        </button>

        {/* Option B */}
        <button
          onClick={() => handleChoice(currentQ.optionB.theme)}
          className="group relative h-[400px] bg-white border-2 border-slate-100 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-indigo-500 hover:shadow-[0_32px_64px_-12px_rgba(79,70,229,0.15)] active:scale-95"
        >
          <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <span className="text-slate-300 group-hover:text-indigo-600 font-black text-sm">B</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-slate-800 group-hover:text-indigo-950 leading-tight max-w-sm">
            {currentQ.optionB.text}
          </p>
        </button>
      </div>

      {/* Submission Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
          <div className="relative">
             <Loader2 className="animate-spin text-indigo-500 mb-8" size={100} strokeWidth={1} />
             <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={32} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Analyzing Your Clinical DNA</h2>
          <p className="text-slate-400 mt-4 font-medium uppercase tracking-[0.3em] text-xs">Processing 34 Talent Themes...</p>
        </div>
      )}

      {/* Error View */}
      {error && (
        <div className="fixed inset-0 bg-white z-[60] p-10 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Sync Connection Failed</h2>
          <p className="text-slate-500 max-w-md mb-10 leading-relaxed font-medium">{error}</p>
          <button 
            onClick={() => submitQuiz(answers)} 
            className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            <Save size={18} /> Retry Final Save
          </button>
        </div>
      )}
    </div>
  );
}