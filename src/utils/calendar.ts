import type { Appointment } from '../types';

export function parseAppointmentDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  let hours = 9;
  let minutes = 0;

  if (timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridian = match[3]?.toUpperCase();
      if (meridian === 'PM' && hours < 12) {
        hours += 12;
      } else if (meridian === 'AM' && hours === 12) {
        hours = 0;
      }
    }
  }

  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;

  const start = new Date(year, month, day, hours, minutes);
  const end = new Date(start.getTime() + 45 * 60 * 1000); // 45-minute consultation window
  return { start, end };
}

function formatIcsDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}${m}${day}T${h}${min}${s}`;
}

export function generateIcsContent(appt: Appointment): string {
  const { start, end } = parseAppointmentDateTime(appt.date, appt.time);
  const startStr = formatIcsDateTime(start);
  const endStr = formatIcsDateTime(end);
  const nowStr = formatIcsDateTime(new Date());
  const uid = `careflow-appt-${appt.id || Date.now()}@careflow.org`;

  const summary = `Medical Consultation: ${appt.purpose} (${appt.doctor_name || 'CareFlow Physician'})`;
  const location = `${appt.hospital_name || 'CareFlow Medical Facility'}${appt.hospital_address ? ', ' + appt.hospital_address : ''}`;
  const description = [
    `CareFlow Medical Consultation: ${appt.purpose}`,
    `Physician: ${appt.doctor_name || 'Assigned Physician'} (${appt.doctor_specialization || 'Consultant'})`,
    `Facility: ${appt.hospital_name || 'Medical Center'}`,
    appt.notes ? `Clinical Notes: ${appt.notes}` : '',
    'Please arrive 10 minutes prior to your scheduled consultation with your health logs and current medications.'
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareFlow Health Systems//Appointment Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Medical Consultation in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(appt: Appointment): boolean {
  try {
    const icsContent = generateIcsContent(appt);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `careflow-appointment-${appt.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download calendar file:', err);
    return false;
  }
}

export function getGoogleCalendarUrl(appt: Appointment): string {
  const { start, end } = parseAppointmentDateTime(appt.date, appt.time);
  const startStr = formatIcsDateTime(start);
  const endStr = formatIcsDateTime(end);

  const text = encodeURIComponent(`Consultation: ${appt.purpose} - ${appt.doctor_name || 'CareFlow Doctor'}`);
  const details = encodeURIComponent(
    `CareFlow Medical Consultation: ${appt.purpose}\n` +
    `Physician: ${appt.doctor_name || 'Assigned Physician'} (${appt.doctor_specialization || 'Clinical Specialist'})\n` +
    `Facility: ${appt.hospital_name || 'Medical Center'}${appt.notes ? '\nNotes: ' + appt.notes : ''}\n` +
    `Please bring your recent daily health logs and medications.`
  );
  const location = encodeURIComponent(`${appt.hospital_name || 'CareFlow Health'}${appt.hospital_address ? ', ' + appt.hospital_address : ''}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}
