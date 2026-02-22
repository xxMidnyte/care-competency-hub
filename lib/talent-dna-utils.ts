export const TRACK_DEFINITIONS = {
  "Clinical Excellence": {
    themes: ["Clinical Scholar", "Clinical Precision", "Data Validator", "Risk Mitigator", "Person-Centered Expert"],
    description: "Focuses on advanced clinical skills, safety protocols, and specialized resident care.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-50"
  },
  "Strategic Leadership": {
    themes: ["Direct Leader", "Momentum Builder", "Legacy Maker", "Performance Driver", "Future-Care Visionary"],
    description: "Designed for those ready to lead teams, drive facility metrics, and manage operations.",
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  "Culture & Mentorship": {
    themes: ["Staff Mentor", "Morale Booster", "Team Integrator", "Staff Storyteller", "Peace Mediator"],
    description: "Ideal for training new staff, building team cohesion, and improving resident engagement.",
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  }
};

export function getRecommendedTrack(top5Themes: string[]) {
  const matches = Object.entries(TRACK_DEFINITIONS).map(([trackName, data]) => {
    const matchCount = top5Themes.filter(t => data.themes.includes(t)).length;
    return { trackName, matchCount, ...data };
  });

  // Sort by highest match count
  return matches.sort((a, b) => b.matchCount - a.matchCount)[0];
}