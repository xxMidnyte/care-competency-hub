"use client";

import { useState } from 'react';
import { CheckCircle, BookOpen, Users, Star, Loader2 } from 'lucide-react';

interface PlanStep {
  title: string;
  detail: string;
}

interface PlanProps {
  trackName: string;
}

export default function DevelopmentPlan({ trackName }: PlanProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const plans: Record<string, { steps: PlanStep[], icon: React.ReactNode }> = {
    "Clinical Excellence": {
      steps: [
        { title: "Specialized Certification", detail: "Identify a clinical specialty (e.g., Wound Care, Gerontology) to lead as a subject matter expert." },
        { title: "Quality Audit Lead", detail: "Partner with the DON to assist in a monthly clinical protocol audit for your unit." },
        { title: "Evidence-Based Project", detail: "Review recent facility data and propose one clinical adjustment to improve resident outcomes." }
      ],
      icon: <Star className="text-emerald-500" />
    },
    "Strategic Leadership": {
      steps: [
        { title: "Leadership Shadowing", detail: "Spend 4 hours shadowing a Unit Manager or Administrator to see operational decision-making." },
        { title: "Preceptor Role", detail: "Take on the primary responsibility of onboarding the next new hire in your department." },
        { title: "Metric Ownership", detail: "Take responsibility for tracking one key facility metric (e.g., call light response times) for 30 days." }
      ],
      icon: <Users className="text-blue-500" />
    },
    "Culture & Mentorship": {
      steps: [
        { title: "Peer Support Lead", detail: "Act as the 'culture champion' for your shift, leading a 5-minute morning huddle once a week." },
        { title: "Training Liaison", detail: "Help translate complex policy changes into 'plain English' for newer staff members." },
        { title: "Recognition Program", detail: "Design a simple peer-to-peer recognition method to boost floor morale." }
      ],
      icon: <BookOpen className="text-purple-500" />
    }
  };

  const currentPlan = plans[trackName] || plans["Clinical Excellence"];

  const handleStartPlan = async () => {
    setIsStarting(true);
    // Simulate API call to save progress
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsStarting(false);
    setHasStarted(true);
  };

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
      <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Next Steps: Your Growth Plan</h3>
          <p className="text-sm text-slate-500">Action items to advance within the {trackName} track.</p>
        </div>
        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
          {currentPlan.icon}
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {currentPlan.steps.map((step, i) => (
          <div key={i} className="flex gap-4 group">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              hasStarted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
            }`}>
              {hasStarted ? <CheckCircle size={16} /> : i + 1}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className={`p-4 border-t transition-colors ${hasStarted ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
        <button 
          onClick={handleStartPlan}
          disabled={isStarting || hasStarted}
          className={`font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-all ${
            hasStarted ? 'text-emerald-600 cursor-default' : 'text-indigo-600 hover:underline active:scale-95'
          }`}
        >
          {isStarting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : hasStarted ? (
            <>Plan Active & Enrolled</>
          ) : (
            <>
              <CheckCircle size={16} /> Mark Plan as Started
            </>
          )}
        </button>
      </div>
    </div>
  );
}