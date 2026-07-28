import { InterviewHistory, InterviewSetup } from '../types/interview';

const HISTORY_STORAGE_KEY = 'kelv-interview-history';
const RESULTS_STORAGE_KEY = 'kelv-platform-results';
const SETUPS_STORAGE_KEY = 'kelv-saved-interview-setups';

export interface SavedInterviewSetup {
  id: string;
  name: string;
  setup: InterviewSetup;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

const getJson = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

const setJson = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const createId = () => crypto.randomUUID?.() || `kelv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const buildHistoryEntry = (sessionData: any): InterviewHistory => {
  const sessionResult = sessionData?.sessionResultV2;
  const transcript = Array.isArray(sessionData?.transcript) ? sessionData.transcript : [];
  const savedAt = sessionData?.savedAt || new Date().toISOString();
  return {
    id: sessionData.id,
    date: new Date(savedAt),
    setup: {
      industry: sessionData?.jobContext?.industry || 'General',
      jobType: sessionData?.jobContext?.role || 'Mock interview',
      experienceLevel: sessionData?.jobContext?.experienceLevel || 'General',
      interviewMode: 'voice'
    },
    overallScore: sessionResult?.overall_scores?.overall || sessionData?.metrics?.overallScore || 0,
    duration: sessionData?.duration || 0,
    questionsAnswered: transcript.filter((entry: { role?: string }) => entry?.role === 'user').length,
    status: 'completed',
    interviewType: sessionData?.interviewType || 'standard'
  };
};

export async function savePlatformInterviewResult(sessionData: any): Promise<string> {
  const id = sessionData?.id || createId();
  const result = { ...sessionData, id, savedAt: new Date().toISOString() };
  const results = getJson<any[]>(RESULTS_STORAGE_KEY, []).filter((entry) => entry?.id !== id);
  setJson(RESULTS_STORAGE_KEY, [result, ...results].slice(0, 50));

  const history = getJson<InterviewHistory[]>(HISTORY_STORAGE_KEY, []).filter((entry) => entry?.id !== id);
  setJson(HISTORY_STORAGE_KEY, [buildHistoryEntry(result), ...history].slice(0, 50));
  return id;
}

export async function getInterviewById(id: string) {
  return getJson<any[]>(RESULTS_STORAGE_KEY, []).find((entry) => entry?.id === id) || null;
}

export async function getInterviewHistory(): Promise<InterviewHistory[]> {
  return getJson<InterviewHistory[]>(HISTORY_STORAGE_KEY, [])
    .map((entry) => ({ ...entry, date: new Date(entry.date) }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function getInterviewStats() {
  const history = await getInterviewHistory();
  const totalDuration = history.reduce((sum, entry) => sum + (entry.duration || 0), 0);
  return {
    totalInterviews: history.length,
    averageScore: history.length ? history.reduce((sum, entry) => sum + entry.overallScore, 0) / history.length : 0,
    totalHours: totalDuration / 3600,
    improvement: 0
  };
}

export async function getUserStrengthsAndWeaknesses() {
  const results = getJson<any[]>(RESULTS_STORAGE_KEY, []);
  const countAreas = (key: 'strengths' | 'weaknesses') => {
    const counts = new Map<string, number>();
    results.forEach((result) => (result?.metrics?.[key] || []).forEach((item: { area?: string }) => {
      if (item?.area) counts.set(item.area, (counts.get(item.area) || 0) + 1);
    }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([area]) => area);
  };
  return { strengths: countAreas('strengths'), weaknesses: countAreas('weaknesses'), categories: {} };
}

export async function getUserInterviewSetups(): Promise<SavedInterviewSetup[]> {
  return getJson<SavedInterviewSetup[]>(SETUPS_STORAGE_KEY, []).sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite) || b.usage_count - a.usage_count);
}

export async function saveInterviewSetup(name: string, setup: InterviewSetup, isFavorite = false) {
  const setups = getJson<SavedInterviewSetup[]>(SETUPS_STORAGE_KEY, []);
  const now = new Date().toISOString();
  const saved: SavedInterviewSetup = { id: createId(), name, setup, is_favorite: isFavorite, usage_count: 0, created_at: now, updated_at: now };
  setJson(SETUPS_STORAGE_KEY, [saved, ...setups]);
  return saved;
}

export async function updateSetupUsage(id: string) {
  updateSetup(id, (setup) => ({ ...setup, usage_count: setup.usage_count + 1, updated_at: new Date().toISOString() }));
}

export async function toggleSetupFavorite(id: string, isFavorite: boolean) {
  updateSetup(id, (setup) => ({ ...setup, is_favorite: isFavorite, updated_at: new Date().toISOString() }));
}

export async function deleteInterviewSetup(id: string): Promise<boolean> {
  const setups = getJson<SavedInterviewSetup[]>(SETUPS_STORAGE_KEY, []);
  setJson(SETUPS_STORAGE_KEY, setups.filter((setup) => setup.id !== id));
  return true;
}

function updateSetup(id: string, update: (setup: SavedInterviewSetup) => SavedInterviewSetup) {
  setJson(SETUPS_STORAGE_KEY, getJson<SavedInterviewSetup[]>(SETUPS_STORAGE_KEY, []).map((setup) => setup.id === id ? update(setup) : setup));
}
