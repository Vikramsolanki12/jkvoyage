import { Trip } from '../types/trip.ts';

export function generateIcsCalendar(trip: Trip): string {
  const events: string[] = [];

  trip.days.forEach((day) => {
    day.activities.forEach((act) => {
      const dateClean = day.date.replace(/-/g, '');
      const timeClean = act.time.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
      const startDateTime = `${dateClean}T${timeClean}00`;
      
      const summary = `${act.title} - ${trip.destination}`;
      const description = `Category: ${act.category}\\nLocation: ${act.location}\\nNotes: ${act.notes || 'N/A'}`;
      const location = act.address || act.location;

      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${act.id}-${trip.id}@jkvoyage.app`,
          `DTSTAMP:${dateClean}T000000Z`,
          `DTSTART:${startDateTime}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${location}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n')
      );
    });
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JKVoyage//Smart Travel Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${trip.title}`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(trip: Trip) {
  const icsData = generateIcsCalendar(trip);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${trip.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
