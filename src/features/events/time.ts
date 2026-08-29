type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function partsAt(instant: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  };
}

function desiredParts(date: string, time: string): DateTimeParts {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    throw new Error('INVALID_LOCAL_DATETIME');
  }
  return { year, month, day, hour, minute };
}

function asUtc(parts: DateTimeParts) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
}

export function zonedDateTimeToIso(
  date: string,
  time: string,
  timeZone: string,
) {
  const desired = desiredParts(date, time);
  let instant = new Date(asUtc(desired));

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = partsAt(instant, timeZone);
    const difference = asUtc(desired) - asUtc(actual);
    if (difference === 0) break;
    instant = new Date(instant.getTime() + difference);
  }

  const roundTrip = partsAt(instant, timeZone);
  if (asUtc(roundTrip) !== asUtc(desired)) {
    throw new Error('INVALID_LOCAL_DATETIME');
  }
  return instant.toISOString();
}

export function isoToEventInputs(iso: string, timeZone: string) {
  const parts = partsAt(new Date(iso), timeZone);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
  };
}

export function formatEventDate(
  iso: string | null,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  if (!iso) return 'Date to be announced';
  return new Intl.DateTimeFormat('en', {
    timeZone,
    dateStyle: 'long',
    ...options,
  }).format(new Date(iso));
}
