import type { Dayjs } from 'dayjs'

export function getMonthList() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}月`,
  }))
}

export function getYearList(startYear: number) {
  const years: number[] = []
  for (let i = startYear; i < startYear + 15; i++) {
    years.push(i)
  }
  return years
}

/**
 * 根据周开始日计算周显示
 * @param dayStartOfWeek 周开始日，0为周日，1为周一
 * @returns 周显示
 */
export function getWeekDays(dayStartOfWeek: number): string[] {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return [...days.slice(dayStartOfWeek), ...days.slice(0, dayStartOfWeek)]
}

/**
 * 生成日历视图所需的日期数据
 * @param month 表示要显示的月份
 * @param dayStartOfWeek 周开始日，0为周日，1为周一
 * @returns 生成一个包含42天的数组（6周 × 7天），这些日期包括：当前月的所有日期、上个月的部分日期（用于填充当前月第一周的空缺）、
 */
export function getMonthDays(month: Dayjs, dayStartOfWeek: number) {
  const firstDay = month.startOf('month')
  const lastDay = month.endOf('month')
  const days: Dayjs[] = []

  // 填充上个月的日期
  const firstDayOfWeek = firstDay.day()
  const prevMonthDays = (firstDayOfWeek - dayStartOfWeek + 7) % 7
  for (let i = prevMonthDays - 1; i >= 0; i--) days.push(firstDay.subtract(i + 1, 'day'))

  // 当前月的日期
  for (let i = 0; i < lastDay.date(); i++) days.push(firstDay.add(i, 'day'))

  // 填充下个月的日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) days.push(lastDay.add(i, 'day'))

  return days
}
