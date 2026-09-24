import type { TimelineEvent, TimelineSpan, EventCategory } from '../types';

export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime(timestamp: number, use24Hour = false): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !use24Hour
  });
}

export function formatTimeShort(timestamp: number, use24Hour = false): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour
  });
}

export function formatDateLabel(isoDate: string): string {
  const today = getTodayIso();
  const yesterday = shiftDate(today, -1);
  const tomorrow = shiftDate(today, 1);

  if (isoDate === today) return 'Today';
  if (isoDate === yesterday) return 'Yesterday';
  if (isoDate === tomorrow) return 'Tomorrow';

  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatDurationCompact(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  return `${minutes}m`;
}

/**
 * Derives the interactive timeline spans between adjacent event markers
 */
export function buildTimelineSpans(
  events: TimelineEvent[], 
  annotations: Record<string, { text: string; category?: EventCategory }>,
  currentNow: number,
  isToday: boolean
): TimelineSpan[] {
  if (events.length === 0) return [];

  const spans: TimelineSpan[] = [];

  for (let i = 0; i < events.length - 1; i++) {
    const start = events[i];
    const end = events[i + 1];
    const key = `${start.id}_${end.id}`;
    const saved = annotations[key];

    spans.push({
      id: key,
      startIndex: i,
      startTime: start.timestamp,
      endTime: end.timestamp,
      durationMs: end.timestamp - start.timestamp,
      startEventId: start.id,
      endEventId: end.id,
      isOngoing: false,
      annotation: saved?.text || '',
      category: saved?.category || start.category || 'deep_work'
    });
  }

  // If this is today, add the ongoing active span from the last event to current clock!
  if (isToday && events.length > 0) {
    const lastEvent = events[events.length - 1];
    const ongoingKey = `${lastEvent.id}_ongoing`;
    const savedOngoing = annotations[ongoingKey];
    const duration = Math.max(0, currentNow - lastEvent.timestamp);

    spans.push({
      id: ongoingKey,
      startIndex: events.length - 1,
      startTime: lastEvent.timestamp,
      endTime: currentNow,
      durationMs: duration,
      startEventId: lastEvent.id,
      isOngoing: true,
      annotation: savedOngoing?.text || '',
      category: savedOngoing?.category || lastEvent.category || 'deep_work'
    });
  }

  return spans;
}
