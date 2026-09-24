/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { BigMarkButton } from './components/BigMarkButton';
import { TimelineView } from './components/TimelineView';
import { CalendarModal } from './components/CalendarModal';
import { InsightsModal } from './components/InsightsModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import type { TimelineEvent, TimelineSpan, AppSettings, EventCategory } from './types';
import { 
  getTodayIso, 
  shiftDate, 
  formatTime, 
  buildTimelineSpans 
} from './utils/date';
import { playSensorySound, triggerHaptic } from './utils/sensory';
import { 
  auth, 
  onAuthStateChanged, 
  type User 
} from './services/firebase';
import { 
  getLocalEvents, 
  persistEvent, 
  removeEvent, 
  persistSpanAnnotation, 
  subscribeToUserEvents, 
  subscribeToAnnotations,
  syncLocalWithCloud,
  getLocalAnnotations
} from './services/storage';

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  soundTheme: 'tactile-click',
  hapticEnabled: true,
  darkMode: true,
  timeFormat24h: false,
  confettiOnMilestone: true,
  vibrationIntensity: 'medium'
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [annotations, setAnnotations] = useState<Record<string, { text: string; category?: EventCategory }>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('chronomark_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Modals
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Live clock tick for ongoing intervals
  const [currentNow, setCurrentNow] = useState<number>(Date.now);

  // PWA Install Prompt
  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        syncLocalWithCloud(user);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA BeforeInstallPrompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [user]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        syncLocalWithCloud(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update theme classes on body/html
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
    try {
      localStorage.setItem('chronomark_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Subscribe to annotations
  useEffect(() => {
    const unsubscribe = subscribeToAnnotations(user, (updatedAnnotations) => {
      setAnnotations(updatedAnnotations);
    });
    return () => unsubscribe();
  }, [user]);

  // Subscribe to events for the selected date
  useEffect(() => {
    // Initial local read for fast instant render
    const all = getLocalEvents();
    setAllEvents(all);
    setEvents(all.filter((e) => e.isoDate === selectedDate));

    // Firestore real-time listener
    const unsubscribe = subscribeToUserEvents(user, selectedDate, (dateEvents) => {
      setEvents(dateEvents);
      setAllEvents(getLocalEvents());
    });

    return () => unsubscribe();
  }, [selectedDate, user]);

  // Live timer interval to update ongoing time markers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayIso = getTodayIso();
  const isToday = selectedDate === todayIso;

  // Build the rich timeline spans between event markers
  const timelineSpans = useMemo(() => {
    return buildTimelineSpans(events, annotations, currentNow, isToday);
  }, [events, annotations, currentNow, isToday]);

  // Latest event timestamp for the big mark button
  const latestEventTimestamp = useMemo(() => {
    if (!isToday || events.length === 0) return undefined;
    return events[events.length - 1].timestamp;
  }, [events, isToday]);

  // Mark Time Trigger (The Big Button)
  const handleMarkTime = useCallback(async (note?: string) => {
    const now = Date.now();
    const isoDate = getTodayIso();

    // If currently browsing an older date, switch view to today
    if (selectedDate !== isoDate) {
      setSelectedDate(isoDate);
    }

    const newEvent: TimelineEvent = {
      id: `evt_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      isoDate: isoDate,
      timeString: formatTime(now, settings.timeFormat24h),
      note: note || '',
      category: 'deep_work',
      createdAt: now,
      updatedAt: now
    };

    // Update state optimistically
    setEvents((prev) => [...prev, newEvent]);
    setAllEvents((prev) => [...prev, newEvent]);

    // Persist offline + cloud
    await persistEvent(newEvent, user);
  }, [selectedDate, settings.timeFormat24h, user]);

  // Update Event timestamp (hour/minute scroll/stepper adjustment)
  const handleUpdateEventTime = async (eventId: string, newTimestamp: number) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const dateObj = new Date(newTimestamp);
    const updated: TimelineEvent = {
      ...target,
      timestamp: newTimestamp,
      timeString: dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !settings.timeFormat24h
      }),
      updatedAt: Date.now()
    };

    setEvents((prev) => {
      const next = prev.map((e) => (e.id === eventId ? updated : e));
      return next.sort((a, b) => a.timestamp - b.timestamp);
    });
    setAllEvents((prev) => {
      const next = prev.map((e) => (e.id === eventId ? updated : e));
      return next.sort((a, b) => a.timestamp - b.timestamp);
    });
    await persistEvent(updated, user);
  };

  // Update Event note
  const handleUpdateEventNote = async (eventId: string, note: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;

    const updated: TimelineEvent = {
      ...target,
      note,
      updatedAt: Date.now()
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    setAllEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    await persistEvent(updated, user);
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setAllEvents((prev) => prev.filter((e) => e.id !== eventId));
    await removeEvent(eventId, user);
  };

  // Split Timeline: insert a new mark between two existing timemarks
  const handleSplitTimeline = async (
    startEventId: string, 
    endEventId: string, 
    splitTimestamp: number, 
    note?: string
  ) => {
    const startEvt = events.find((e) => e.id === startEventId);
    if (!startEvt) return;

    const dateObj = new Date(splitTimestamp);
    const newEvent: TimelineEvent = {
      id: `evt_${splitTimestamp}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: splitTimestamp,
      isoDate: startEvt.isoDate,
      timeString: dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: !settings.timeFormat24h
      }),
      note: note || '',
      category: 'deep_work',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setEvents((prev) => {
      const next = [...prev, newEvent];
      return next.sort((a, b) => a.timestamp - b.timestamp);
    });

    setAllEvents((prev) => {
      const next = [...prev, newEvent];
      return next.sort((a, b) => a.timestamp - b.timestamp);
    });

    // Provide pleasant feedback if enabled
    if (settings.hapticEnabled) {
      triggerHaptic([30, 40]);
    }
    if (settings.soundEnabled) {
      playSensorySound(settings.soundTheme, 0.8);
    }

    await persistEvent(newEvent, user);
  };

  // Save span annotation (text entered on the graphical line between markers)
  const handleSaveSpanAnnotation = useCallback(async (
    spanKey: string, 
    text: string, 
    category: EventCategory
  ) => {
    setAnnotations((prev) => ({
      ...prev,
      [spanKey]: { text, category }
    }));
    await persistSpanAnnotation(spanKey, text, category, user);
  }, [user]);

  // Date Navigation
  const handlePrevDay = () => setSelectedDate((d) => shiftDate(d, -1));
  const handleNextDay = () => setSelectedDate((d) => shiftDate(d, 1));
  const handleToday = () => setSelectedDate(getTodayIso());

  // Trigger PWA Install
  const handleInstallPwa = async () => {
    if (!installPromptEvent) return;
    const promptEvent = installPromptEvent as unknown as { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setCanInstallPwa(false);
      setInstallPromptEvent(null);
    }
  };

  // Seed sample demo day data
  const handleSeedDemoData = async () => {
    const baseNow = Date.now();
    const demoItems: TimelineEvent[] = [
      {
        id: `evt_demo_1`,
        timestamp: baseNow - 1000 * 60 * 180, // 3 hours ago
        isoDate: selectedDate,
        timeString: formatTime(baseNow - 1000 * 60 * 180, settings.timeFormat24h),
        note: 'Sprint kick-off & task priority list',
        category: 'planning',
        createdAt: baseNow - 1000 * 60 * 180,
        updatedAt: baseNow - 1000 * 60 * 180
      },
      {
        id: `evt_demo_2`,
        timestamp: baseNow - 1000 * 60 * 115, // 1h 55m ago
        isoDate: selectedDate,
        timeString: formatTime(baseNow - 1000 * 60 * 115, settings.timeFormat24h),
        note: 'Completed architectural core flow',
        category: 'deep_work',
        createdAt: baseNow - 1000 * 60 * 115,
        updatedAt: baseNow - 1000 * 60 * 115
      },
      {
        id: `evt_demo_3`,
        timestamp: baseNow - 1000 * 60 * 45, // 45m ago
        isoDate: selectedDate,
        timeString: formatTime(baseNow - 1000 * 60 * 45, settings.timeFormat24h),
        note: 'Coffee break & stretch',
        category: 'break',
        createdAt: baseNow - 1000 * 60 * 45,
        updatedAt: baseNow - 1000 * 60 * 45
      }
    ];

    for (const item of demoItems) {
      await persistEvent(item, user);
    }

    // Set initial span annotations
    await persistSpanAnnotation('evt_demo_1_evt_demo_2', 'Architected database models & responsive tactile button', 'deep_work', user);
    await persistSpanAnnotation('evt_demo_2_evt_demo_3', 'Recharged with herbal tea and short walk', 'break', user);

    setEvents(demoItems);
    setAllEvents((prev) => [...prev.filter((e) => e.isoDate !== selectedDate), ...demoItems]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-amber-500/30 selection:text-amber-600 dark:selection:text-amber-200">
      {/* Top Header */}
      <Header
        selectedDate={selectedDate}
        isToday={isToday}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
        onOpenCalendar={() => setIsCalendarOpen(true)}
        onOpenInsights={() => setIsInsightsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isOnline={isOnline}
        user={user}
        hasUnsyncedChanges={false}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        darkMode={settings.darkMode}
        onToggleDarkMode={() => setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between max-w-4xl w-full mx-auto pb-8">
        
        {/* Top Timeline Zone */}
        <section className="flex-1 w-full py-4">
          <TimelineView
            events={events}
            spans={timelineSpans}
            isToday={isToday}
            onUpdateEventNote={handleUpdateEventNote}
            onUpdateEventTime={handleUpdateEventTime}
            onDeleteEvent={handleDeleteEvent}
            onSaveSpanAnnotation={handleSaveSpanAnnotation}
            onSplitTimeline={handleSplitTimeline}
            timeFormat24h={settings.timeFormat24h}
            onSeedDemoData={handleSeedDemoData}
          />
        </section>

        {/* Bottom Hero Action: Big Tactile Mark Button */}
        {isToday ? (
          <section className="sticky bottom-0 w-full pt-2 pb-6 bg-gradient-to-t from-slate-50 via-slate-50/95 dark:from-slate-950 dark:via-slate-950/95 to-transparent backdrop-blur-xs transition-colors">
            <BigMarkButton
              onMarkTime={handleMarkTime}
              lastEventTimestamp={latestEventTimestamp}
              soundEnabled={settings.soundEnabled}
              soundTheme={settings.soundTheme}
              hapticEnabled={settings.hapticEnabled}
              totalEventsToday={events.length}
            />
          </section>
        ) : (
          <section className="py-6 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
              <span>Viewing historical logs for {selectedDate}</span>
              <button
                type="button"
                onClick={handleToday}
                className="font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 underline cursor-pointer"
              >
                Return to Today to Mark Time
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Modals & Drawers */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        allEvents={allEvents}
      />

      <InsightsModal
        isOpen={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        date={selectedDate}
        events={events}
        spans={timelineSpans}
        user={user}
        allEvents={allEvents}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
      />
    </div>
  );
}
