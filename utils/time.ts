export function formatTimestamp(unixTimeMs: number): string {
  const date = new Date(unixTimeMs);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); // e.g., "3:00 PM"
}

export function formatDate(unixTimeMs: number): string {
  const date = new Date(unixTimeMs);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }); // e.g., "Oct 13"
}

export function formatDuration(durationMins: number): string {
  if (durationMins < 60) return `${durationMins}m`;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  return `${hours}h ${mins}m`;
}

export function formatLogDuration(startTimeMs: number, endTimeMs: number | null, fallbackDurationMins: number | null): string {
  if (endTimeMs) {
    const diffSecs = Math.max(0, Math.floor((endTimeMs - startTimeMs) / 1000));
    if (diffSecs < 60) return `${diffSecs}s`;
    
    const hours = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  }
  return formatDuration(fallbackDurationMins || 0);
}

export function formatLiveDuration(startTimeMs: number, currentTimeMs: number): string {
  const diffSecs = Math.max(0, Math.floor((currentTimeMs - startTimeMs) / 1000));
  const hours = Math.floor(diffSecs / 3600);
  const mins = Math.floor((diffSecs % 3600) / 60);
  const secs = diffSecs % 60;
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
