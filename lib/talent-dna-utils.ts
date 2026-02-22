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

/**
 * Calculates the recommended growth track based on the top 5 themes.
 */
export function getRecommendedTrack(top5Themes: string[]) {
  const matches = Object.entries(TRACK_DEFINITIONS).map(([trackName, data]) => {
    const matchCount = top5Themes.filter(t => data.themes.includes(t)).length;
    return { trackName, matchCount, ...data };
  });

  // Sort by highest match count
  return matches.sort((a, b) => b.matchCount - a.matchCount)[0];
}

/**
 * Generates a "Power Pairing" insight based on the relationship 
 * between the user's two strongest talents.
 */
export function getPowerPairing(top5Themes: string[]) {
  if (!top5Themes || top5Themes.length < 2) return null;

  const t1 = top5Themes[0];
  const t2 = top5Themes[1];

  const pairings: Record<string, { title: string; insight: string }> = {
    "Direct Leader+Team Integrator": {
      title: "The Inclusive Commander",
      insight: "You provide clear, decisive direction while ensuring every voice on the unit is heard. You don't just lead; you build a unified front."
    },
    "Direct Leader+Staff Mentor": {
      title: "The Developing Director",
      insight: "You lead with authority but use your position to actively coach others. You don't just give orders; you build the next generation of leaders."
    },
    "Consistent Producer+Data Validator": {
      title: "The Evidence-Based Doer",
      insight: "You don't just work hard; you work smart. Your drive for results is always backed by clinical data, ensuring high-quality, accurate outcomes."
    },
    "Staff Mentor+Holistic Thinker": {
      title: "The Empathetic Developer",
      insight: "You see the human behind the clinician. You grow your team by understanding their personal struggles and professional potential simultaneously."
    },
    "Crisis Fixer+Risk Mitigator": {
      title: "The Safety Sentinel",
      insight: "You are the ultimate floor insurance. You have the foresight to prevent disasters and the cool head needed to resolve them if they occur."
    },
    "Excellence Seeker+Clinical Precision": {
      title: "The Quality Architect",
      insight: "You have a zero-tolerance policy for mediocrity. Your obsession with detail ensures that clinical standards are not just met, but exceeded."
    },
    "Momentum Builder+Morale Booster": {
      title: "The Energy Catalyst",
      insight: "You are the heartbeat of the shift. You possess the rare ability to drive productivity while keeping the emotional atmosphere light and positive."
    },
    "Future-Care Visionary+Creative Strategist": {
      title: "The Clinical Innovator",
      insight: "You live six months in the future. You aren't just solving today's staffing issues; you are designing the systems to prevent them tomorrow."
    }
  };

  const key = `${t1}+${t2}`;
  const reverseKey = `${t2}+${t1}`;

  return pairings[key] || pairings[reverseKey] || {
    title: "Dynamic Synergy",
    insight: `Your top two talents, ${t1} and ${t2}, work in tandem to create a unique clinical edge, balancing high-level action with intentionality.`
  };
}