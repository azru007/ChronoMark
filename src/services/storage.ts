import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  writeBatch,
  type User 
} from './firebase';
import type { TimelineEvent, EventCategory } from '../types';

const LOCAL_STORAGE_EVENTS_KEY = 'chronomark_local_events_v1';
const LOCAL_STORAGE_ANNOTATIONS_KEY = 'chronomark_local_annotations_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'chronomark_user_settings_v1';

// Read local events
export function getLocalEvents(): TimelineEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read local events:', err);
    return [];
  }
}

// Write local events
export function setLocalEvents(events: TimelineEvent[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to write local events:', err);
  }
}

// Read local annotations (key: "eventAId_eventBId")
export function getLocalAnnotations(): Record<string, { text: string; category?: EventCategory }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ANNOTATIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Save local annotation
export function setLocalAnnotation(spanKey: string, text: string, category?: EventCategory) {
  try {
    const current = getLocalAnnotations();
    current[spanKey] = { text, category };
    localStorage.setItem(LOCAL_STORAGE_ANNOTATIONS_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to write local annotation:', err);
  }
}

/**
 * Save or update a timeline event (offline-first + Firestore sync)
 */
export async function persistEvent(event: TimelineEvent, user: User | null): Promise<void> {
  // 1. Immediately update local storage
  const localList = getLocalEvents();
  const existingIdx = localList.findIndex(e => e.id === event.id);
  
  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...event, updatedAt: Date.now() };
  } else {
    localList.push({ ...event, updatedAt: Date.now() });
  }
  // Sort chronological
  localList.sort((a, b) => a.timestamp - b.timestamp);
  setLocalEvents(localList);

  // 2. If user is online & logged in, push to Firestore
  if (user && navigator.onLine) {
    try {
      const userEventRef = doc(db, 'users', user.uid, 'events', event.id);
      await setDoc(userEventRef, {
        ...event,
        userId: user.uid,
        synced: true,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (error) {
      console.warn('Firestore write failed, stored locally for subsequent sync:', error);
    }
  }
}

/**
 * Delete a timeline event
 */
export async function removeEvent(eventId: string, user: User | null): Promise<void> {
  // 1. Update local storage
  const localList = getLocalEvents().filter(e => e.id !== eventId);
  setLocalEvents(localList);

  // 2. Delete from Firestore if authenticated
  if (user && navigator.onLine) {
    try {
      const userEventRef = doc(db, 'users', user.uid, 'events', eventId);
      await deleteDoc(userEventRef);
    } catch (err) {
      console.warn('Firestore delete failed:', err);
    }
  }
}

/**
 * Persist span annotation (text entered on the line between event markers)
 */
export async function persistSpanAnnotation(
  spanKey: string, 
  text: string, 
  category: EventCategory, 
  user: User | null
): Promise<void> {
  // 1. Local storage
  setLocalAnnotation(spanKey, text, category);

  // 2. Cloud Firestore sync
  if (user && navigator.onLine) {
    try {
      const annotationRef = doc(db, 'users', user.uid, 'annotations', spanKey);
      await setDoc(annotationRef, {
        spanKey,
        text,
        category,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Failed to sync span annotation to Firestore:', err);
    }
  }
}

/**
 * Sync offline items when logging in or coming back online
 */
export async function syncLocalWithCloud(user: User): Promise<TimelineEvent[]> {
  if (!navigator.onLine) return getLocalEvents();

  const localEvents = getLocalEvents();
  if (localEvents.length > 0) {
    try {
      const batch = writeBatch(db);
      localEvents.forEach(evt => {
        const ref = doc(db, 'users', user.uid, 'events', evt.id);
        batch.set(ref, {
          ...evt,
          userId: user.uid,
          synced: true
        }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Batch sync error:', err);
    }
  }

  // Also sync annotations
  const localAnnotations = getLocalAnnotations();
  const annotationKeys = Object.keys(localAnnotations);
  if (annotationKeys.length > 0) {
    try {
      const batch = writeBatch(db);
      annotationKeys.forEach(key => {
        const ref = doc(db, 'users', user.uid, 'annotations', key);
        batch.set(ref, {
          spanKey: key,
          text: localAnnotations[key].text,
          category: localAnnotations[key].category || 'deep_work',
          updatedAt: Date.now()
        }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Batch annotations sync error:', err);
    }
  }

  return getLocalEvents();
}

/**
 * Subscribe to real-time events for a specific user and date
 */
export function subscribeToUserEvents(
  user: User | null,
  isoDate: string,
  onUpdate: (events: TimelineEvent[]) => void
): () => void {
  if (!user) {
    // Return local filtered events
    const all = getLocalEvents();
    const filtered = all.filter(e => e.isoDate === isoDate);
    onUpdate(filtered);
    return () => {};
  }

  const eventsCol = collection(db, 'users', user.uid, 'events');
  const q = query(eventsCol, where('isoDate', '==', isoDate));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const cloudEvents: TimelineEvent[] = [];
    snapshot.forEach((d) => {
      cloudEvents.push(d.data() as TimelineEvent);
    });
    
    // Sort chronologically
    cloudEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Merge into local cache
    const existingOtherDates = getLocalEvents().filter(e => e.isoDate !== isoDate);
    setLocalEvents([...existingOtherDates, ...cloudEvents]);

    onUpdate(cloudEvents);
  }, (err) => {
    console.warn('Firestore subscription fallback to local data:', err);
    const all = getLocalEvents();
    onUpdate(all.filter(e => e.isoDate === isoDate));
  });

  return unsubscribe;
}

/**
 * Subscribe to real-time annotations for a user
 */
export function subscribeToAnnotations(
  user: User | null,
  onUpdate: (annotations: Record<string, { text: string; category?: EventCategory }>) => void
): () => void {
  if (!user) {
    onUpdate(getLocalAnnotations());
    return () => {};
  }

  const annotationsCol = collection(db, 'users', user.uid, 'annotations');
  const unsubscribe = onSnapshot(annotationsCol, (snapshot) => {
    const cloudAnnotations: Record<string, { text: string; category?: EventCategory }> = { ...getLocalAnnotations() };
    snapshot.forEach((d) => {
      const data = d.data() as { spanKey: string; text: string; category?: EventCategory };
      if (data && data.spanKey) {
        cloudAnnotations[data.spanKey] = {
          text: data.text || '',
          category: data.category || 'deep_work'
        };
      }
    });
    // Save to local cache
    try {
      localStorage.setItem(LOCAL_STORAGE_ANNOTATIONS_KEY, JSON.stringify(cloudAnnotations));
    } catch {}
    onUpdate(cloudAnnotations);
  }, () => {
    onUpdate(getLocalAnnotations());
  });

  return unsubscribe;
}
