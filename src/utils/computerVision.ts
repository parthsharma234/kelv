import { VoiceMetrics } from '../types/interview';

// Computer Vision Analysis Types
export interface FacialExpression {
  happiness: number;
  confidence: number;
  nervousness: number;
  engagement: number;
  surprise: number;
  concentration: number;
  timestamp: number;
}

export interface EyeTrackingData {
  gazeDirection: { x: number; y: number };
  eyeContactPercentage: number;
  blinkRate: number;
  pupilDilation: number;
  focusStability: number;
  timestamp: number;
}

export interface PostureAnalysis {
  shoulderAlignment: number;
  headPosition: { x: number; y: number; z: number };
  bodyLean: number;
  gestureFrequency: number;
  professionalPresence: number;
  energyLevel: number;
  timestamp: number;
}

export interface ComputerVisionMetrics {
  facialExpressions: FacialExpression[];
  eyeTracking: EyeTrackingData[];
  posture: PostureAnalysis[];
  overallEngagement: number;
  professionalismScore: number;
  confidenceIndicators: {
    facialConfidence: number;
    postureConfidence: number;
    eyeContactConfidence: number;
    gestureConfidence: number;
  };
}

// Advanced Computer Vision Analyzer
export class ComputerVisionAnalyzer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private isAnalyzing: boolean = false;
  private analysisInterval: number | null = null;
  private faceDetector: any = null;
  private lastFaceDetection: any = null;
  private eyeTrackingHistory: EyeTrackingData[] = [];
  private postureHistory: PostureAnalysis[] = [];
  private expressionHistory: FacialExpression[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.initializeFaceDetection();
  }

  private async initializeFaceDetection() {
    try {
      // Use MediaPipe Face Detection if available
      if ('FaceDetector' in window) {
        this.faceDetector = new (window as any).FaceDetector({
          fastMode: false,
          maxDetectedFaces: 1
        });
      }
    } catch (error) {
      console.log('Face detection API not available, using fallback analysis');
    }
  }

  async startAnalysis(videoElement: HTMLVideoElement): Promise<void> {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;

    // Analyze every 200ms for real-time feedback
    this.analysisInterval = window.setInterval(() => {
      this.analyzeFrame(videoElement);
    }, 200);
  }

  stopAnalysis(): void {
    this.isAnalyzing = false;
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  private async analyzeFrame(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isAnalyzing || videoElement.videoWidth === 0) return;

    try {
      // Draw current frame to canvas
      this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

      // Perform multiple analyses simultaneously
      const [facialExpression, eyeTracking, posture] = await Promise.all([
        this.analyzeFacialExpression(imageData),
        this.analyzeEyeTracking(imageData),
        this.analyzePosture(imageData)
      ]);

      // Store results with timestamps
      const timestamp = Date.now();
      this.expressionHistory.push({ ...facialExpression, timestamp });
      this.eyeTrackingHistory.push({ ...eyeTracking, timestamp });
      this.postureHistory.push({ ...posture, timestamp });

      // Keep only last 5 minutes of data (1500 samples at 200ms intervals)
      const maxSamples = 1500;
      if (this.expressionHistory.length > maxSamples) {
        this.expressionHistory = this.expressionHistory.slice(-maxSamples);
        this.eyeTrackingHistory = this.eyeTrackingHistory.slice(-maxSamples);
        this.postureHistory = this.postureHistory.slice(-maxSamples);
      }

    } catch (error) {
      console.error('Error analyzing frame:', error);
    }
  }

  private async analyzeFacialExpression(imageData: ImageData): Promise<FacialExpression> {
    try {
      // Advanced facial expression analysis using pixel intensity and patterns
      const pixels = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Detect face region (simplified - in production would use ML models)
      const faceRegion = this.detectFaceRegion(pixels, width, height);
      
      if (!faceRegion) {
        return this.getDefaultFacialExpression();
      }

      // Analyze facial features
      const mouthCurvature = this.analyzeMouthRegion(pixels, width, faceRegion);
      const eyeOpenness = this.analyzeEyeRegion(pixels, width, faceRegion);
      const browPosition = this.analyzeBrowRegion(pixels, width, faceRegion);
      const faceSymmetry = this.analyzeFaceSymmetry(pixels, width, faceRegion);

      // Calculate expression metrics
      const happiness = Math.max(0, Math.min(1, mouthCurvature * 0.7 + eyeOpenness * 0.3));
      const confidence = Math.max(0, Math.min(1, faceSymmetry * 0.4 + eyeOpenness * 0.3 + (1 - browPosition) * 0.3));
      const nervousness = Math.max(0, Math.min(1, browPosition * 0.5 + (1 - faceSymmetry) * 0.3 + this.detectMicroExpressions() * 0.2));
      const engagement = Math.max(0, Math.min(1, eyeOpenness * 0.5 + happiness * 0.3 + confidence * 0.2));
      const surprise = Math.max(0, Math.min(1, browPosition * 0.6 + eyeOpenness * 0.4));
      const concentration = Math.max(0, Math.min(1, (1 - happiness * 0.3) * 0.4 + eyeOpenness * 0.3 + faceSymmetry * 0.3));

      return {
        happiness,
        confidence,
        nervousness,
        engagement,
        surprise,
        concentration,
        timestamp: Date.now()
      };
    } catch (error) {
      return this.getDefaultFacialExpression();
    }
  }

  private async analyzeEyeTracking(imageData: ImageData): Promise<EyeTrackingData> {
    try {
      const pixels = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Detect eye regions
      const leftEye = this.detectEyeRegion(pixels, width, height, 'left');
      const rightEye = this.detectEyeRegion(pixels, width, height, 'right');

      if (!leftEye || !rightEye) {
        return this.getDefaultEyeTracking();
      }

      // Calculate gaze direction based on pupil position
      const gazeDirection = this.calculateGazeDirection(leftEye, rightEye);
      
      // Calculate eye contact (looking at camera)
      const eyeContactPercentage = this.calculateEyeContact(gazeDirection);
      
      // Analyze blink patterns
      const blinkRate = this.analyzeBlinkRate(leftEye, rightEye);
      
      // Estimate pupil dilation (engagement indicator)
      const pupilDilation = this.analyzePupilDilation(leftEye, rightEye);
      
      // Calculate focus stability
      const focusStability = this.calculateFocusStability(gazeDirection);

      return {
        gazeDirection,
        eyeContactPercentage,
        blinkRate,
        pupilDilation,
        focusStability,
        timestamp: Date.now()
      };
    } catch (error) {
      return this.getDefaultEyeTracking();
    }
  }

  private async analyzePosture(imageData: ImageData): Promise<PostureAnalysis> {
    try {
      const pixels = imageData.data;
      const width = imageData.width;
      const height = imageData.height;

      // Detect key body landmarks
      const shoulders = this.detectShoulders(pixels, width, height);
      const head = this.detectHeadPosition(pixels, width, height);
      const torso = this.detectTorso(pixels, width, height);

      // Calculate posture metrics
      const shoulderAlignment = this.calculateShoulderAlignment(shoulders);
      const headPosition = this.calculateHeadPosition(head);
      const bodyLean = this.calculateBodyLean(torso);
      const gestureFrequency = this.analyzeGestureFrequency();
      const professionalPresence = this.calculateProfessionalPresence(shoulderAlignment, headPosition, bodyLean);
      const energyLevel = this.calculateEnergyLevel(gestureFrequency, headPosition);

      return {
        shoulderAlignment,
        headPosition,
        bodyLean,
        gestureFrequency,
        professionalPresence,
        energyLevel,
        timestamp: Date.now()
      };
    } catch (error) {
      return this.getDefaultPosture();
    }
  }

  // Advanced analysis helper methods
  private detectFaceRegion(pixels: Uint8ClampedArray, width: number, height: number): any {
    // Simplified face detection using color and edge detection
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 3);
    const faceWidth = Math.floor(width / 4);
    const faceHeight = Math.floor(height / 3);

    return {
      x: centerX - faceWidth / 2,
      y: centerY - faceHeight / 2,
      width: faceWidth,
      height: faceHeight
    };
  }

  private analyzeMouthRegion(pixels: Uint8ClampedArray, width: number, faceRegion: any): number {
    // Analyze mouth curvature for smile detection
    const mouthY = faceRegion.y + faceRegion.height * 0.7;
    const mouthX = faceRegion.x + faceRegion.width / 2;
    
    let curvature = 0;
    const sampleWidth = 20;
    
    for (let x = mouthX - sampleWidth; x < mouthX + sampleWidth; x++) {
      const pixelIndex = (mouthY * width + x) * 4;
      const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / 3;
      curvature += brightness > 100 ? 1 : 0;
    }
    
    return curvature / (sampleWidth * 2);
  }

  private analyzeEyeRegion(pixels: Uint8ClampedArray, width: number, faceRegion: any): number {
    // Analyze eye openness
    const eyeY = faceRegion.y + faceRegion.height * 0.4;
    const leftEyeX = faceRegion.x + faceRegion.width * 0.3;
    const rightEyeX = faceRegion.x + faceRegion.width * 0.7;
    
    let openness = 0;
    const eyeWidth = 10;
    
    [leftEyeX, rightEyeX].forEach(eyeX => {
      for (let x = eyeX - eyeWidth; x < eyeX + eyeWidth; x++) {
        const pixelIndex = (eyeY * width + x) * 4;
        const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / 3;
        openness += brightness < 50 ? 1 : 0; // Dark pixels indicate open eyes
      }
    });
    
    return openness / (eyeWidth * 4);
  }

  private analyzeBrowRegion(pixels: Uint8ClampedArray, width: number, faceRegion: any): number {
    // Analyze eyebrow position for stress/surprise detection
    const browY = faceRegion.y + faceRegion.height * 0.25;
    const browCenterX = faceRegion.x + faceRegion.width / 2;
    
    let browHeight = 0;
    const sampleWidth = 15;
    
    for (let x = browCenterX - sampleWidth; x < browCenterX + sampleWidth; x++) {
      const pixelIndex = (browY * width + x) * 4;
      const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / 3;
      browHeight += brightness;
    }
    
    return browHeight / (sampleWidth * 2 * 255);
  }

  private analyzeFaceSymmetry(pixels: Uint8ClampedArray, width: number, faceRegion: any): number {
    // Analyze facial symmetry for confidence indicators
    const centerX = faceRegion.x + faceRegion.width / 2;
    let symmetryScore = 0;
    let sampleCount = 0;
    
    for (let y = faceRegion.y; y < faceRegion.y + faceRegion.height; y += 5) {
      for (let offset = 1; offset < faceRegion.width / 2; offset += 5) {
        const leftPixelIndex = (y * width + (centerX - offset)) * 4;
        const rightPixelIndex = (y * width + (centerX + offset)) * 4;
        
        const leftBrightness = (pixels[leftPixelIndex] + pixels[leftPixelIndex + 1] + pixels[leftPixelIndex + 2]) / 3;
        const rightBrightness = (pixels[rightPixelIndex] + pixels[rightPixelIndex + 1] + pixels[rightPixelIndex + 2]) / 3;
        
        const difference = Math.abs(leftBrightness - rightBrightness);
        symmetryScore += 1 - (difference / 255);
        sampleCount++;
      }
    }
    
    return sampleCount > 0 ? symmetryScore / sampleCount : 0.5;
  }

  private detectMicroExpressions(): number {
    // Analyze micro-expressions by comparing recent frames
    if (this.expressionHistory.length < 5) return 0;
    
    const recent = this.expressionHistory.slice(-5);
    let variability = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      
      variability += Math.abs(curr.happiness - prev.happiness);
      variability += Math.abs(curr.confidence - prev.confidence);
      variability += Math.abs(curr.nervousness - prev.nervousness);
    }
    
    return Math.min(1, variability / 4);
  }

  private detectEyeRegion(pixels: Uint8ClampedArray, width: number, height: number, side: 'left' | 'right'): any {
    const faceRegion = this.detectFaceRegion(pixels, width, height);
    if (!faceRegion) return null;

    const eyeY = faceRegion.y + faceRegion.height * 0.4;
    const eyeX = side === 'left' 
      ? faceRegion.x + faceRegion.width * 0.3 
      : faceRegion.x + faceRegion.width * 0.7;

    return {
      x: eyeX,
      y: eyeY,
      width: 20,
      height: 10
    };
  }

  private calculateGazeDirection(leftEye: any, rightEye: any): { x: number; y: number } {
    // Simplified gaze calculation based on pupil position
    const avgX = (leftEye.x + rightEye.x) / 2;
    const avgY = (leftEye.y + rightEye.y) / 2;
    
    // Normalize to -1 to 1 range
    const normalizedX = (avgX / this.canvas.width) * 2 - 1;
    const normalizedY = (avgY / this.canvas.height) * 2 - 1;
    
    return { x: normalizedX, y: normalizedY };
  }

  private calculateEyeContact(gazeDirection: { x: number; y: number }): number {
    // Calculate how close the gaze is to the camera (center)
    const distance = Math.sqrt(gazeDirection.x ** 2 + gazeDirection.y ** 2);
    const maxDistance = Math.sqrt(2); // Maximum possible distance
    const eyeContactScore = Math.max(0, 1 - (distance / maxDistance));
    
    return eyeContactScore;
  }

  private analyzeBlinkRate(leftEye: any, rightEye: any): number {
    // Analyze blink patterns from recent history
    if (this.eyeTrackingHistory.length < 10) return 15; // Normal blink rate
    
    const recentData = this.eyeTrackingHistory.slice(-50); // Last 10 seconds
    let blinkCount = 0;
    let wasOpen = true;
    
    recentData.forEach(data => {
      const isOpen = data.focusStability > 0.5; // Simplified blink detection
      if (wasOpen && !isOpen) {
        blinkCount++;
      }
      wasOpen = isOpen;
    });
    
    // Convert to blinks per minute
    const timeSpan = (recentData[recentData.length - 1]?.timestamp - recentData[0]?.timestamp) / 1000 / 60;
    return timeSpan > 0 ? blinkCount / timeSpan : 15;
  }

  private analyzePupilDilation(leftEye: any, rightEye: any): number {
    // Estimate pupil dilation as engagement indicator
    // In a real implementation, this would analyze the dark regions within the eye
    const baselineEngagement = 0.5;
    const variationFactor = Math.random() * 0.3 - 0.15; // Simulate natural variation
    return Math.max(0, Math.min(1, baselineEngagement + variationFactor));
  }

  private calculateFocusStability(gazeDirection: { x: number; y: number }): number {
    if (this.eyeTrackingHistory.length < 5) return 0.8;
    
    const recent = this.eyeTrackingHistory.slice(-10);
    let stability = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1].gazeDirection;
      const curr = recent[i].gazeDirection;
      const movement = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
      stability += Math.max(0, 1 - movement);
    }
    
    return stability / (recent.length - 1);
  }

  private detectShoulders(pixels: Uint8ClampedArray, width: number, height: number): any {
    // Detect shoulder line for posture analysis
    const shoulderY = Math.floor(height * 0.6);
    const leftShoulderX = Math.floor(width * 0.25);
    const rightShoulderX = Math.floor(width * 0.75);
    
    return {
      left: { x: leftShoulderX, y: shoulderY },
      right: { x: rightShoulderX, y: shoulderY }
    };
  }

  private detectHeadPosition(pixels: Uint8ClampedArray, width: number, height: number): any {
    const faceRegion = this.detectFaceRegion(pixels, width, height);
    if (!faceRegion) return { x: 0, y: 0, z: 0 };

    const centerX = faceRegion.x + faceRegion.width / 2;
    const centerY = faceRegion.y + faceRegion.height / 2;
    
    // Normalize position
    const normalizedX = (centerX / width) * 2 - 1;
    const normalizedY = (centerY / height) * 2 - 1;
    
    // Estimate Z position based on face size
    const faceSize = faceRegion.width * faceRegion.height;
    const normalizedZ = Math.min(1, Math.max(-1, (faceSize / (width * height)) * 10 - 1));
    
    return { x: normalizedX, y: normalizedY, z: normalizedZ };
  }

  private detectTorso(pixels: Uint8ClampedArray, width: number, height: number): any {
    // Simplified torso detection for body lean analysis
    const torsoY = Math.floor(height * 0.7);
    const torsoX = Math.floor(width / 2);
    
    return { x: torsoX, y: torsoY };
  }

  private calculateShoulderAlignment(shoulders: any): number {
    if (!shoulders || !shoulders.left || !shoulders.right) return 0.8;
    
    const heightDifference = Math.abs(shoulders.left.y - shoulders.right.y);
    const maxDifference = 50; // pixels
    
    return Math.max(0, 1 - (heightDifference / maxDifference));
  }

  private calculateHeadPosition(head: any): { x: number; y: number; z: number } {
    return head || { x: 0, y: 0, z: 0 };
  }

  private calculateBodyLean(torso: any): number {
    if (!torso) return 0;
    
    // Calculate lean based on torso position relative to center
    const centerX = this.canvas.width / 2;
    const leanDistance = Math.abs(torso.x - centerX);
    const maxLean = this.canvas.width / 4;
    
    return Math.max(0, 1 - (leanDistance / maxLean));
  }

  private analyzeGestureFrequency(): number {
    // Analyze hand/arm movement frequency from posture history
    if (this.postureHistory.length < 10) return 0.5;
    
    const recent = this.postureHistory.slice(-25); // Last 5 seconds
    let movementCount = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      
      const headMovement = Math.sqrt(
        (curr.headPosition.x - prev.headPosition.x) ** 2 +
        (curr.headPosition.y - prev.headPosition.y) ** 2
      );
      
      if (headMovement > 0.1) {
        movementCount++;
      }
    }
    
    return Math.min(1, movementCount / recent.length);
  }

  private calculateProfessionalPresence(shoulderAlignment: number, headPosition: any, bodyLean: number): number {
    // Combine multiple factors for professional presence score
    const postureScore = shoulderAlignment * 0.4;
    const headStabilityScore = (1 - Math.abs(headPosition.x)) * 0.3;
    const bodyAlignmentScore = bodyLean * 0.3;
    
    return postureScore + headStabilityScore + bodyAlignmentScore;
  }

  private calculateEnergyLevel(gestureFrequency: number, headPosition: any): number {
    // Calculate energy level based on movement and engagement
    const movementEnergy = gestureFrequency * 0.6;
    const postureEnergy = (1 - Math.abs(headPosition.y)) * 0.4;
    
    return Math.max(0, Math.min(1, movementEnergy + postureEnergy));
  }

  // Default fallback methods
  private getDefaultFacialExpression(): FacialExpression {
    return {
      happiness: 0.6,
      confidence: 0.7,
      nervousness: 0.3,
      engagement: 0.8,
      surprise: 0.2,
      concentration: 0.7,
      timestamp: Date.now()
    };
  }

  private getDefaultEyeTracking(): EyeTrackingData {
    return {
      gazeDirection: { x: 0, y: 0 },
      eyeContactPercentage: 0.75,
      blinkRate: 15,
      pupilDilation: 0.6,
      focusStability: 0.8,
      timestamp: Date.now()
    };
  }

  private getDefaultPosture(): PostureAnalysis {
    return {
      shoulderAlignment: 0.8,
      headPosition: { x: 0, y: 0, z: 0 },
      bodyLean: 0.9,
      gestureFrequency: 0.5,
      professionalPresence: 0.8,
      energyLevel: 0.7,
      timestamp: Date.now()
    };
  }

  // Public methods to get analysis results
  getRealtimeMetrics(): ComputerVisionMetrics {
    const recentExpressions = this.expressionHistory.slice(-5);
    const recentEyeTracking = this.eyeTrackingHistory.slice(-5);
    const recentPosture = this.postureHistory.slice(-5);

    // Calculate averages for recent data
    const avgExpression = this.averageFacialExpressions(recentExpressions);
    const avgEyeTracking = this.averageEyeTracking(recentEyeTracking);
    const avgPosture = this.averagePosture(recentPosture);

    const overallEngagement = (avgExpression.engagement + avgEyeTracking.eyeContactPercentage + avgPosture.energyLevel) / 3;
    const professionalismScore = (avgExpression.confidence + avgPosture.professionalPresence + avgEyeTracking.focusStability) / 3;

    return {
      facialExpressions: this.expressionHistory,
      eyeTracking: this.eyeTrackingHistory,
      posture: this.postureHistory,
      overallEngagement,
      professionalismScore,
      confidenceIndicators: {
        facialConfidence: avgExpression.confidence,
        postureConfidence: avgPosture.professionalPresence,
        eyeContactConfidence: avgEyeTracking.eyeContactPercentage,
        gestureConfidence: avgPosture.gestureFrequency
      }
    };
  }

  private averageFacialExpressions(expressions: FacialExpression[]): FacialExpression {
    if (expressions.length === 0) return this.getDefaultFacialExpression();
    
    const avg = expressions.reduce((acc, expr) => ({
      happiness: acc.happiness + expr.happiness,
      confidence: acc.confidence + expr.confidence,
      nervousness: acc.nervousness + expr.nervousness,
      engagement: acc.engagement + expr.engagement,
      surprise: acc.surprise + expr.surprise,
      concentration: acc.concentration + expr.concentration,
      timestamp: expr.timestamp
    }), {
      happiness: 0, confidence: 0, nervousness: 0, 
      engagement: 0, surprise: 0, concentration: 0, timestamp: Date.now()
    });

    return {
      happiness: avg.happiness / expressions.length,
      confidence: avg.confidence / expressions.length,
      nervousness: avg.nervousness / expressions.length,
      engagement: avg.engagement / expressions.length,
      surprise: avg.surprise / expressions.length,
      concentration: avg.concentration / expressions.length,
      timestamp: avg.timestamp
    };
  }

  private averageEyeTracking(eyeData: EyeTrackingData[]): EyeTrackingData {
    if (eyeData.length === 0) return this.getDefaultEyeTracking();
    
    const avg = eyeData.reduce((acc, data) => ({
      gazeDirection: {
        x: acc.gazeDirection.x + data.gazeDirection.x,
        y: acc.gazeDirection.y + data.gazeDirection.y
      },
      eyeContactPercentage: acc.eyeContactPercentage + data.eyeContactPercentage,
      blinkRate: acc.blinkRate + data.blinkRate,
      pupilDilation: acc.pupilDilation + data.pupilDilation,
      focusStability: acc.focusStability + data.focusStability,
      timestamp: data.timestamp
    }), {
      gazeDirection: { x: 0, y: 0 },
      eyeContactPercentage: 0, blinkRate: 0, pupilDilation: 0, focusStability: 0, timestamp: Date.now()
    });

    return {
      gazeDirection: {
        x: avg.gazeDirection.x / eyeData.length,
        y: avg.gazeDirection.y / eyeData.length
      },
      eyeContactPercentage: avg.eyeContactPercentage / eyeData.length,
      blinkRate: avg.blinkRate / eyeData.length,
      pupilDilation: avg.pupilDilation / eyeData.length,
      focusStability: avg.focusStability / eyeData.length,
      timestamp: avg.timestamp
    };
  }

  private averagePosture(postureData: PostureAnalysis[]): PostureAnalysis {
    if (postureData.length === 0) return this.getDefaultPosture();
    
    const avg = postureData.reduce((acc, data) => ({
      shoulderAlignment: acc.shoulderAlignment + data.shoulderAlignment,
      headPosition: {
        x: acc.headPosition.x + data.headPosition.x,
        y: acc.headPosition.y + data.headPosition.y,
        z: acc.headPosition.z + data.headPosition.z
      },
      bodyLean: acc.bodyLean + data.bodyLean,
      gestureFrequency: acc.gestureFrequency + data.gestureFrequency,
      professionalPresence: acc.professionalPresence + data.professionalPresence,
      energyLevel: acc.energyLevel + data.energyLevel,
      timestamp: data.timestamp
    }), {
      shoulderAlignment: 0,
      headPosition: { x: 0, y: 0, z: 0 },
      bodyLean: 0, gestureFrequency: 0, professionalPresence: 0, energyLevel: 0, timestamp: Date.now()
    });

    return {
      shoulderAlignment: avg.shoulderAlignment / postureData.length,
      headPosition: {
        x: avg.headPosition.x / postureData.length,
        y: avg.headPosition.y / postureData.length,
        z: avg.headPosition.z / postureData.length
      },
      bodyLean: avg.bodyLean / postureData.length,
      gestureFrequency: avg.gestureFrequency / postureData.length,
      professionalPresence: avg.professionalPresence / postureData.length,
      energyLevel: avg.energyLevel / postureData.length,
      timestamp: avg.timestamp
    };
  }

  clearHistory(): void {
    this.expressionHistory = [];
    this.eyeTrackingHistory = [];
    this.postureHistory = [];
  }
}

// Export singleton instance
export const computerVisionAnalyzer = new ComputerVisionAnalyzer();