export type AIStrategyRecommendation = {
  best_strategy: string;
  reason: string;
  estimated_time: string;
  impact_summary: string;
  confidence: "high" | "medium" | "low";
  ordered_actions: string[];
  alternatives: Array<{
    name: string;
    impact: string;
    tradeoff: string;
  }>;
  caution: string | null;
};

export type StrategyContextScenario = {
  id: string;
  name: string;
  gain: number;
  projected_crs?: number;
  estimated_priority: "high" | "medium" | "low";
  program_target?: string;
  eligible?: boolean;
};

export type StrategyContextProfile = {
  current_crs: number;
  english_clb?: number;
  french_clb?: number;
  canadian_experience_years?: number;
  job_offer?: boolean;
  pnp?: boolean;
  language?: "en" | "es";
  education_label?: string;
  foreign_experience_label?: string;
  canadian_credential_label?: string;
  profile_mode_label?: string;
};

export type AIStrategyContext = {
  current_crs: number;
  program_target: string;
  source: "live_profile" | "saved_roadmap";
  benchmark_general?: number;
  benchmark_category?: number;
  scenarios: StrategyContextScenario[];
  best_realistic_path?: string;
  highest_upside_path?: string;
  fastest_start_path?: string;
  parallel_path?: string;
  english_threshold_signal?: string;
  french_threshold_signal?: string;
  profile_signals?: string[];
  profile: StrategyContextProfile;
  latest_saved_roadmap_at?: string;
};
