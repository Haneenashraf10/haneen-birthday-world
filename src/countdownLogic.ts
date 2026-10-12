// Haneen's birthday: 15 October (months start from 0, so 9 = October)
const BIRTH_MONTH_INDEX = 9
const BIRTH_DAY = 15
const DAY_MS = 86400000

export type CountdownState =
  | { kind: 'today' }
  | {
      kind: 'before' | 'after'
      days: number
      hours: number
      minutes: number
      seconds: number
      daysSince: number
    }

// After the birthday we keep showing "the birthday was N days ago" for this long
const RECENT_DAYS = 150

export function getCountdownState(now: Date): CountdownState {
  const year = now.getFullYear()
  const thisYear = new Date(year, BIRTH_MONTH_INDEX, BIRTH_DAY)

  if (now.getMonth() === BIRTH_MONTH_INDEX && now.getDate() === BIRTH_DAY) {
    return { kind: 'today' }
  }

  // has this year's birthday already passed?
  const passed = now.getTime() > thisYear.getTime()

  const lastBirthday = passed
    ? thisYear
    : new Date(year - 1, BIRTH_MONTH_INDEX, BIRTH_DAY)

  const nextBirthday = passed
    ? new Date(year + 1, BIRTH_MONTH_INDEX, BIRTH_DAY)
    : thisYear

  const startOfToday = new Date(year, now.getMonth(), now.getDate())

  const daysSince = Math.round(
    (startOfToday.getTime() - lastBirthday.getTime()) / DAY_MS,
  )

  const totalSeconds = Math.floor(
    (nextBirthday.getTime() - now.getTime()) / 1000,
  )

  return {
    kind: daysSince <= RECENT_DAYS ? 'after' : 'before',
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    daysSince,
  }
}