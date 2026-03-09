/**
 * Calendar link utilities for Google Calendar and ICS file generation
 */

export function generateGoogleCalendarUrl(params: {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}): string {
  const start = new Date(params.startDate).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(params.endDate).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("dates", `${start}/${end}`);
  if (params.location) url.searchParams.set("location", params.location);
  if (params.description) url.searchParams.set("details", params.description);
  
  return url.toString();
}

export function generateICSFile(params: {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}): string {
  const formatDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TicketHall//Event//PT",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(params.startDate)}`,
    `DTEND:${formatDate(params.endDate)}`,
    `SUMMARY:${params.title}`,
    params.location ? `LOCATION:${params.location}` : "",
    params.description ? `DESCRIPTION:${params.description.replace(/\n/g, "\\n").substring(0, 500)}` : "",
    `UID:${Date.now()}@tickethall.com`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  
  return lines.join("\r\n");
}

export function downloadICS(params: {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}) {
  const icsContent = generateICSFile(params);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${params.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
