# Kelv Posture Analysis System

Real-time posture and body language analysis system for AI-powered mock interviews using MediaPipe and computer vision.

## Features

- **Real-time Analysis**: Processes video recordings to analyze posture, eye contact, hand movements, and fidgeting
- **MediaPipe Integration**: Uses Google's MediaPipe for robust pose detection and facial landmark analysis
- **Background Processing**: Asynchronous job processing using Celery with Redis
- **REST API**: FastAPI-based API for triggering analysis and retrieving results
- **Database Integration**: Stores results in Supabase/PostgreSQL with timeline data
- **Timeline Overlay**: Provides timestamped data for frontend visualization

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   Celery        │
│   (React)       │◄──►│   API Server    │◄──►│   Workers       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Supabase      │    │   MediaPipe     │
                       │   Database      │    │   CV Processor  │
                       └─────────────────┘    └─────────────────┘
```

## Installation

### Prerequisites

- Python 3.11+
- Redis (for Celery)
- FFmpeg (for video processing)
- Docker & Docker Compose (recommended)

### Docker Setup (Recommended)

1. Clone the repository and navigate to the posture analysis directory:
```bash
cd backend/posture_analysis
```

2. Copy environment file and configure:
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. Start all services:
```bash
docker-compose up -d
```

This will start:
- Redis (message broker)
- FastAPI API server (port 8000)
- Celery worker
- Celery beat (scheduler)
- Flower (monitoring, port 5555)

### Manual Setup

1. Install system dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg libopencv-dev python3-opencv

# macOS
brew install ffmpeg opencv
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start Redis:
```bash
redis-server
```

4. Start the services in separate terminals:
```bash
# API Server
uvicorn api:app --host 0.0.0.0 --port 8000 --reload

# Celery Worker
celery -A worker worker --loglevel=info

# Celery Beat (optional, for periodic tasks)
celery -A worker beat --loglevel=info
```

## API Usage

### Start Analysis

```bash
curl -X POST "http://localhost:8000/analysis/start" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "video_url": "https://your-storage.com/video.mp4",
    "analysis_config": {
      "interval_ms": 500
    }
  }'
```

Response:
```json
{
  "task_id": "celery-task-id",
  "status": "queued",
  "session_id": "session-123",
  "estimated_duration": "2-5 minutes"
}
```

### Check Status

```bash
curl "http://localhost:8000/analysis/status/{task_id}"
```

### Get Results

```bash
curl "http://localhost:8000/analysis/results/{session_id}"
```

### Get Timeline Data

```bash
curl "http://localhost:8000/analysis/timeline/{session_id}?limit=100"
```

## Analysis Output

The system analyzes video at regular intervals (default 500ms) and outputs:

### Timeline Data Point
```json
{
  "timestamp": "00:01:15.000",
  "posture_score": 0.85,
  "eye_contact": true,
  "hand_movement_score": 0.3,
  "fidgeting_score": 0.2,
  "head_pose": {"yaw": -5.2, "pitch": 2.1, "roll": 0.8},
  "shoulder_alignment": 0.9,
  "back_straightness": 0.8,
  "movement_velocity": 0.1
}
```

### Summary Metrics
```json
{
  "avg_posture_score": 0.75,
  "eye_contact_percentage": 68.5,
  "avg_hand_movement_score": 0.4,
  "avg_fidgeting_score": 0.3,
  "overall_body_language_score": 0.72,
  "top_posture_moments": [...],
  "problem_areas": ["Limited eye contact", "Excessive fidgeting"],
  "recommendations": ["Practice maintaining eye contact", "Try to minimize fidgeting"]
}
```

## Database Schema

The system uses two main tables:

- `posture_analysis`: Stores summary data and metadata
- `posture_timeline`: Stores detailed timestamped metrics

See `supabase/migrations/20250128000000_add_posture_analysis_tables.sql` for the complete schema.

## Monitoring

- **Flower**: Web-based Celery monitoring at http://localhost:5555
- **Health Check**: GET /health for service status
- **Worker Stats**: GET /worker/stats for queue information

## Configuration

Key environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access
- `REDIS_URL`: Redis connection string
- `DEFAULT_ANALYSIS_INTERVAL_MS`: Analysis interval (default: 500ms)
- `MAX_VIDEO_SIZE_MB`: Maximum video file size (default: 500MB)

## Development

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
black .
flake8 .
mypy .
```

### Adding New Metrics

1. Extend the `PostureMetrics` dataclass in `cv_processor.py`
2. Update the analysis methods in `PostureAnalyzer`
3. Update the database schema migration
4. Update the API response models

## Troubleshooting

### Common Issues

1. **MediaPipe Installation**: Ensure you have the correct Python version (3.11+)
2. **Video Download Fails**: Check network connectivity and video URL accessibility
3. **Memory Issues**: Reduce worker concurrency or analysis interval
4. **Database Connection**: Verify Supabase credentials and network access

### Logging

The system uses structured logging. Check logs for:
- Task progress and errors
- Database connection issues
- Video processing problems
- MediaPipe warnings

## License

MIT License - see LICENSE file for details.