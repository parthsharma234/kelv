/**
 * React hook for managing posture analysis data and API calls
 */

import { useState, useEffect, useCallback } from 'react';

// Types for posture analysis data
export interface PostureTimelinePoint {
  timestamp_ms: number;
  timestamp_formatted: string;
  posture_score: number;
  eye_contact: boolean;
  hand_movement_score: number;
  fidgeting_score: number;
  head_pose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  shoulder_alignment: number;
  back_straightness: number;
  movement_velocity: number;
}

export interface PostureAnalysisResult {
  id: string;
  session_id: string;
  video_url: string;
  created_at: string;
  total_duration: number;
  avg_posture_score: number;
  eye_contact_percentage: number;
  avg_hand_movement_score: number;
  avg_fidgeting_score: number;
  overall_body_language_score: number;
  top_posture_moments: Array<{
    timestamp: string;
    timestamp_ms: number;
    posture_score: number;
    description: string;
  }>;
  problem_areas: string[];
  recommendations: string[];
}

export interface PostureAnalysisStatus {
  task_id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE';
  progress?: number;
  message?: string;
  result?: any;
  error?: string;
}

interface UsePostureAnalysisReturn {
  // Data
  analysisResult: PostureAnalysisResult | null;
  timelineData: PostureTimelinePoint[];
  analysisStatus: PostureAnalysisStatus | null;
  
  // Loading states
  isLoading: boolean;
  isAnalyzing: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  startAnalysis: (sessionId: string, videoUrl: string) => Promise<string | null>;
  checkAnalysisStatus: (taskId: string) => Promise<PostureAnalysisStatus | null | undefined>;
  fetchAnalysisResult: (sessionId: string) => Promise<PostureAnalysisResult | null | undefined>;
  fetchTimelineData: (sessionId: string, limit?: number) => Promise<PostureTimelinePoint[] | undefined>;
  clearError: () => void;
}

const POSTURE_API_BASE_URL = import.meta.env.REACT_APP_POSTURE_API_URL || 'http://localhost:8000';

export const usePostureAnalysis = (): UsePostureAnalysisReturn => {
  const [analysisResult, setAnalysisResult] = useState<PostureAnalysisResult | null>(null);
  const [timelineData, setTimelineData] = useState<PostureTimelinePoint[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<PostureAnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startAnalysis = useCallback(async (sessionId: string, videoUrl: string): Promise<string | null> => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch(`${POSTURE_API_BASE_URL}/analysis/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          video_url: videoUrl,
          analysis_config: {
            interval_ms: 500
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setAnalysisStatus({
        task_id: data.task_id,
        status: 'PENDING',
        message: 'Analysis queued'
      });

      return data.task_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start posture analysis';
      setError(errorMessage);
      console.error('Error starting posture analysis:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const checkAnalysisStatus = useCallback(async (taskId: string): Promise<PostureAnalysisStatus | null | undefined> => {
    try {
      const response = await fetch(`${POSTURE_API_BASE_URL}/analysis/status/${taskId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const statusData = await response.json();
      setAnalysisStatus(statusData);
      // If analysis is complete and successful, we could automatically fetch results
      if (statusData.status === 'SUCCESS' && statusData.result?.session_id) {
        // Optionally auto-fetch results here
        // await fetchAnalysisResult(statusData.result.session_id);
      }
      return statusData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check analysis status';
      setError(errorMessage);
      console.error('Error checking analysis status:', err);
      return null;
    }
  }, []);

  const fetchAnalysisResult = useCallback(async (sessionId: string): Promise<PostureAnalysisResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${POSTURE_API_BASE_URL}/analysis/results/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Posture analysis not found for this session');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analysis results';
      setError(errorMessage);
      console.error('Error fetching analysis results:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTimelineData = useCallback(async (sessionId: string, limit?: number): Promise<PostureTimelinePoint[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const url = new URL(`${POSTURE_API_BASE_URL}/analysis/timeline/${sessionId}`);
      if (limit) {
        url.searchParams.set('limit', limit.toString());
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Timeline data not found for this session');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setTimelineData(result.data || []);
      return result.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timeline data';
      setError(errorMessage);
      console.error('Error fetching timeline data:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll for status updates when analysis is in progress
  useEffect(() => {
    if (!analysisStatus?.task_id || analysisStatus.status === 'SUCCESS' || analysisStatus.status === 'FAILURE') {
      return;
    }

    const pollInterval = setInterval(() => {
      checkAnalysisStatus(analysisStatus.task_id);
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [analysisStatus?.task_id, analysisStatus?.status, checkAnalysisStatus]);

  return {
    // Data
    analysisResult,
    timelineData,
    analysisStatus,
    
    // Loading states
    isLoading,
    isAnalyzing,
    
    // Error states
    error,
    
    // Actions
    startAnalysis,
    checkAnalysisStatus,
    fetchAnalysisResult,
    fetchTimelineData,
    clearError,
  };
};