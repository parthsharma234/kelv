export interface HumeJobPrediction {
  source: {
    filename: string;
    content_type: string;
  };
  results: {
    predictions: Array<{
      file: string;
      models: {
        face?: {
          grouped_predictions: Array<{
            id: string;
            predictions: Array<{
              frame: number;
              time: number;
              prob: number;
              box: { x: number; y: number; w: number; h: number };
              emotions: Array<{ name: string; score: number }>;
            }>;
          }>;
        };
        prosody?: {
          grouped_predictions: Array<{
            id: string;
            predictions: Array<{
              text: string;
              time: { begin: number; end: number };
              confidence: number;
              speaker_confidence: number;
              emotions: Array<{ name: string; score: number }>;
            }>;
          }>;
        };
        language?: {
            grouped_predictions: Array<{
                id: string;
                predictions: Array<{
                    text: string;
                    time: { begin: number; end: number };
                    emotions: Array<{ name: string; score: number }>;
                    sentiment: Array<{ name: string; score: number }>; // Determine exact structure via runtime test if needed
                }>;
            }>;
        }
      };
    }>;
  };
}

export class HumeBatchClient {
  private apiKey: string;
  private baseUrl = 'https://api.hume.ai/v0/batch';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startJob(blob: Blob): Promise<string> {
    const formData = new FormData();
    // Hume models configuration
    const json_req = {
        models: {
            face: { min_face_size: 100 },
            prosody: {},
            language: { granularity: "sentence" }, // Request content analysis too
            burst: {} // Vocal bursts
        }
    };
    
    formData.append('json', JSON.stringify(json_req));
    formData.append('file', blob, 'interview_recording.webm');

    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start Hume job: ${error}`);
    }

    const data = await response.json();
    return data.job_id;
  }

  async getJobStatus(jobId: string): Promise<'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      headers: { 'X-Hume-Api-Key': this.apiKey }
    });
    
    if (!response.ok) throw new Error('Failed to check job status');
    
    const data = await response.json();
    return data.state.status;
  }

  async getJobPredictions(jobId: string): Promise<HumeJobPrediction[]> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/predictions`, {
      headers: { 'X-Hume-Api-Key': this.apiKey }
    });

    if (!response.ok) throw new Error('Failed to get predictions');

    return await response.json();
  }

  // Helper to poll until complete
  async waitForCompletion(jobId: string, intervalMs = 2000): Promise<HumeJobPrediction[]> {
    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const status = await this.getJobStatus(jobId);
          console.log(`[Hume] Job ${jobId} status: ${status}`);

          if (status === 'COMPLETED') {
            const predictions = await this.getJobPredictions(jobId);
            resolve(predictions);
          } else if (status === 'FAILED') {
            reject(new Error('Hume job failed processing'));
          } else {
            setTimeout(check, intervalMs);
          }
        } catch (err) {
          reject(err);
        }
      };
      
      check();
    });
  }
}
