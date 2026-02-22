"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Timer, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getRecommendedTrack } from '@/lib/talent-dna-utils';

interface Question {
  id: number;
  left_theme: string;
  left_statement: string;
  right_theme: string;
  right_statement: string;
}

export default function TalentDNAEngine() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Load Questions from Supabase
  useEffect(() => {
    const loadQuestions = async () => {
      const { data, error } = await supabase
        .from('care_hub_questions') // Ensure this matches your table name
        .select('*');

      if (error) {
        console.error("Error fetching questions:", error);
      } else {
        // Shuffle questions so the experience feels organic
        setQuestions(data.sort(() => Math.random() - 0.5));
      }
      setIsLoading(false);
    };
    loadQuestions();
  }, [supabase]);

  // 2. Submit Logic
  const submitFinalResults = async (finalScores: Record<string, number>) => {
    setIsSaving(true);
    
    // Get current user session
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No user found");
      return;
    }

    // Logic: Sort scores and find Top 5 names
    const top5Names = Object.entries(finalScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    // Calculate the recommended track using our utility
    const recommendation = getRecommendedTrack(top5Names);

    const { error } = await supabase
      .from('talent_dna_results')
      .upsert({
        user_id: user.id,
        raw_scores_json: finalScores,
        top_5_themes: top5Names,
        recommended_track: recommendation.trackName,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error saving results:", error.message);
      setIsSaving(false);
    } else {
      router.push('/dashboard/talent-dna/results');
    }
  };

  // 3. Choice Handler
  const handleChoice = useCallback((selection: 'left' | 'right' | 'neutral') => {
    const q = questions[currentIndex];
    if (!q) return;

    const newScores = { ...scores };
    const { left_theme: lTheme, right_theme: rTheme } = q;

    if (selection === 'left') {
      newScores[lTheme] = (newScores[lTheme] || 0) + 3;
      newScores[rTheme] = (newScores[rTheme] || 0) - 1;
    } else if (selection === 'right') {
      newScores[lTheme] = (newScores[lTheme] || 0) - 1;
      newScores[rTheme] = (newScores[rTheme] || 0) + 3;
    } else {
      newScores[lTheme] = (newScores[lTheme] || 0) + 0.25;
      newScores[rTheme] = (newScores[rTheme] || 0) + 0.25;
    }

    setScores(newScores);
    setTimeLeft(20);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      submitFinalResults(newScores);
    }
  }, [currentIndex, questions, scores]);

  // 4. Timer Logic
  useEffect(() => {
    if (isFinished || isLoading || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleChoice('neutral');
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isFinished, isLoading, questions, handleChoice]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500 gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
        <p className="font-medium">Loading Assessment Questions...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-2xl">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-slate-900">Great work!</h2>
        <p className="text-slate-600 text-lg mb-8">
          {isSaving ? "Finalizing your results..." : "Your assessment is complete. Let's see your results."}
        </p>
        {isSaving && <Loader2 className="animate-spin text-indigo-500 mx-auto" />}
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = (currentIndex / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${timeLeft <= 5 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
            <Timer size={20} />
          </div>
          <span className={`text-xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-600' : 'text-slate-700'}`}>
            0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
          </span>
        </div>
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Progress: {Math.round(progressPercent)}%
        </span>
      </div>

      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-700 ease-in-out" 
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative pt-4">
        <button 
          onClick={() => handleChoice('left')}
          className="group relative bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-1 p-12 rounded-[2rem] transition-all duration-300 text-left min-h-[320px] flex flex-col justify-center"
        >
          <span className="absolute top-6 left-8 text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Option A</span>
          <p className="text-2xl font-semibold text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
            {currentQ?.left_statement}
          </p>
        </button>

        <button 
          onClick={() => handleChoice('right')}
          className="group relative bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-1 p-12 rounded-[2rem] transition-all duration-300 text-left min-h-[320px] flex flex-col justify-center"
        >
          <span className="absolute top-6 left-8 text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Option B</span>
          <p className="text-2xl font-semibold text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
            {currentQ?.right_statement}
          </p>
        </button>

        <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex flex-col items-center">
          <button 
            onClick={() => handleChoice('neutral')}
            className="bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200 transition-all shadow-sm active:scale-95"
          >
            Skip / Neutral
          </button>
        </div>
      </div>
      
      <p className="text-center text-slate-400 text-sm font-medium">
        Question {currentIndex + 1} of {questions.length}
      </p>
    </div>
  );
}