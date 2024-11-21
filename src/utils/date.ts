import type { Dayjs } from 'dayjs'

/**
 * 获取月份列表
 * @returns 月份列表
 */
export function getMonthList() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}月`,
  }))
}

/**
 * 获取年份列表
 * @param startYear 开始年份
 * @returns 年份列表
 */
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

/**
 * 获取日期单元格的样式
 * @param day 日期
 * @param currentDisplayMonth 当前显示的月份
 * @param selectedStartDate 选中的开始日期
 * @param selectedEndDate 选中的结束日期
 * @returns 日期单元格的样式
 */
export function getDateClass(day: Dayjs, currentDisplayMonth: Dayjs, selectedStartDate: Dayjs | null, selectedEndDate: Dayjs | null) {
  const isCurrentMonth = day.month() === currentDisplayMonth.month()
  const isSelected = selectedStartDate?.isSame(day, 'day') || selectedEndDate?.isSame(day, 'day')
  const isInRange = selectedStartDate
    && selectedEndDate
    && day.isAfter(selectedStartDate, 'day')
    && day.isBefore(selectedEndDate, 'day')
    && isCurrentMonth // 只有当前月份的日期才显示范围样式
  const isOtherMonth = !isCurrentMonth
  const isStartDate = selectedStartDate?.isSame(day, 'day') && isCurrentMonth
  const isEndDate = selectedEndDate?.isSame(day, 'day') && isCurrentMonth

  return {
    'selected': isSelected && isCurrentMonth,
    'in-range': isInRange,
    'other-month': isOtherMonth,
    'start-date': isStartDate,
    'end-date': isEndDate,
    'current-month': isCurrentMonth,
  }
}
