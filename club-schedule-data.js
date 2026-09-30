/* Shared sample club sessions. Production schedules are managed by the Mompreneur. */
(() => {
  'use strict';
  const sampleClub = { id: 'parklands', name: 'Parklands Club' };
  const sampleSessions = [
    {
      id: 'club-2026-10-02',
      clubId: 'parklands',
      title: 'Robotics class',
      date: '2026-10-02',
      start: '15:00',
      end: '16:30',
      location: 'Parklands Club',
      note: 'Bring your curiosity. We’ll put your new skills into practice.',
      previousStart: null,
      previousEnd: null,
    },
    {
      id: 'club-2026-10-09',
      clubId: 'parklands',
      title: 'Robotics class',
      date: '2026-10-09',
      start: '16:00',
      end: '17:30',
      location: 'Parklands Club',
      note: 'This class starts one hour later than usual. Your Mompreneur has updated the session time.',
      previousStart: '15:00',
      previousEnd: '16:30',
    },
    {
      id: 'club-2026-10-16',
      clubId: 'parklands',
      title: 'Robotics class',
      date: '2026-10-16',
      start: '15:00',
      end: '16:30',
      location: 'Parklands Club',
      note: 'Continue building, testing and learning with your club.',
      previousStart: null,
      previousEnd: null,
    },
  ];
  const dateFromISO = (iso) => new Date(iso + 'T12:00:00Z');
  const formatDate = (
    iso,
    options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  ) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(dateFromISO(iso));
  const timeRange = (session) =>
    `${window.KIASecurity.isTime(session.start) ? session.start : '—'} – ${window.KIASecurity.isTime(session.end) ? session.end : '—'}`;
  const sessionURL = (session) => `schedule.html?session=${encodeURIComponent(session.id)}`;
  function context() {
    const state = window.KIAAdminData?.read();
    const u = window.KIAAccounts?.current();
    const club =
      state?.branches.find((b) => b.id === u?.branchId) ||
      (u ? { id: null, name: 'Awaiting club assignment' } : sampleClub);
    const sessions = (state?.sessions || sampleSessions)
      .filter(
        (s) =>
          (s.branchId || s.clubId) === club.id &&
          window.KIASecurity.isDate(s.date) &&
          window.KIASecurity.isTime(s.start) &&
          window.KIASecurity.isTime(s.end)
      )
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    return { club, sessions };
  }
  window.KIAClubSchedule = {
    sampleSessions,
    get club() {
      return context().club;
    },
    get sessions() {
      return context().sessions;
    },
    dateFromISO,
    formatDate,
    timeRange,
    sessionURL,
  };
})();
