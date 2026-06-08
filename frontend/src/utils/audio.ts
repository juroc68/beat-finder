
// Helper to convert key number and mode into standard musical notation
export const getMusicalKey = (keyNum?: number, mode?: number): string => {
  if (keyNum === undefined || mode === undefined || keyNum < 0 || keyNum > 11) return '';
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modeText = mode === 1 ? 'Maj' : 'Min';
  return `${keys[keyNum]} ${modeText}`;
};

// Client-Side Beat Detection (Peak Detection / Auto-Threshold)
export const estimateBpmFromBuffer = (audioBuffer: AudioBuffer): number => {
  const channelData = audioBuffer.getChannelData(0); // Left channel
  const sampleRate = audioBuffer.sampleRate;
  
  // Find maximum amplitude in audio data
  let maxVal = 0;
  for (let i = 0; i < channelData.length; i++) {
    const val = Math.abs(channelData[i]);
    if (val > maxVal) maxVal = val;
  }
  
  // Peak threshold is set to 70% of absolute peak amplitude
  const threshold = maxVal * 0.7;
  const peaks: number[] = [];
  
  // Minimum time interval between peaks (0.24s, roughly max 250 BPM)
  const minPeakDistance = Math.round(sampleRate * 0.24);
  let lastPeakTime = 0;
  
  // Detect indices of energy peaks
  for (let i = 0; i < channelData.length; i++) {
    const val = Math.abs(channelData[i]);
    if (val > threshold && (i - lastPeakTime) > minPeakDistance) {
      peaks.push(i);
      lastPeakTime = i;
    }
  }
  
  if (peaks.length < 2) return 120; // Default fallback if no peaks found
  
  // Map sample intervals between peaks into BPMs
  const intervals: { [key: number]: number } = {};
  for (let i = 1; i < peaks.length; i++) {
    const intervalSamples = peaks[i] - peaks[i - 1];
    const intervalSeconds = intervalSamples / sampleRate;
    let rawBpm = 60 / intervalSeconds;
    
    // Normalize BPM to standard 70 - 150 BPM range for DJs/Dancers
    while (rawBpm < 70) rawBpm *= 2;
    while (rawBpm > 150) rawBpm /= 2;
    
    const bpm = Math.round(rawBpm);
    intervals[bpm] = (intervals[bpm] || 0) + 1;
  }
  
  // Find the BPM value that repeats the most (mode)
  let maxCount = 0;
  let estimatedBpm = 120;
  for (const bpmStr in intervals) {
    const bpm = parseInt(bpmStr);
    const count = intervals[bpm];
    if (count > maxCount) {
      maxCount = count;
      estimatedBpm = bpm;
    }
  }
  
  return estimatedBpm;
};
