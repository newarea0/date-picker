import type { Dayjs } from 'dayjs'
import { FORMAT } from '@/constants'
import { getDateClass, getMonthDays, getWeekDays } from '@/utils/date'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface DateRangePickerOptions {
  element: HTMLElement
  value?: [Date | null, Date | null]
  dayStartOfWeek?: number
  onChange?: (dates: [Date | null, Date | null]) => void
}

export class DateRangePicker {
  private element: HTMLElement
  private container: HTMLElement
  private pickerPopup: HTMLElement | null = null
  private startInput: HTMLInputElement
  private endInput: HTMLInputElement
  private dayStartOfWeek: number
  private showPicker = false
  private isSelectingEndDate = false
  private showYearPicker: 'start' | 'end' | null = null
  private showMonthPicker: 'start' | 'end' | null = null
  private startMonth: Dayjs = dayjs()
  private endMonth: Dayjs = dayjs().add(1, 'month')
  private selectedStartDate: Dayjs | null = null
  private selectedEndDate: Dayjs | null = null
  private onChange?: (dates: [Date | null, Date | null]) => void
  private yearRangeStart: number = dayjs().year() - 7

  constructor(options: DateRangePickerOptions) {
    this.element = options.element
    this.dayStartOfWeek = options.dayStartOfWeek ?? 0
    this.onChange = options.onChange

    // 创建基础容器
    this.container = document.createElement('div')
    this.container.className = 'date-range-picker'

    // 创建输入框容器
    const inputWrapper = document.createElement('div')
    inputWrapper.className = 'input-wrapper'

    // 创建开始日期输入框
    this.startInput = document.createElement('input')
    this.startInput.type = 'text'
    this.startInput.placeholder = FORMAT

    // 创建分隔符
    const separator = document.createElement('span')
    separator.className = 'separator'
    separator.textContent = '至'

    // 创建结束日期输入框
    this.endInput = document.createElement('input')
    this.endInput.type = 'text'
    this.endInput.placeholder = FORMAT

    // 创建日历图标
    const calendarIcon = document.createElement('span')
    calendarIcon.className = 'calendar-icon'
    calendarIcon.innerHTML = '📅'

    // 组装输入框容器
    inputWrapper.appendChild(this.startInput)
    inputWrapper.appendChild(separator)
    inputWrapper.appendChild(this.endInput)
    inputWrapper.appendChild(calendarIcon)

    this.container.appendChild(inputWrapper)
    this.element.appendChild(this.container)

    // 绑定事件
    this.bindEvents()

    // 设置初始值
    if (options.value) {
      this.setValue(options.value)
    }
  }

  private bindEvents(): void {
    // 输入框事件
    this.startInput.addEventListener('focus', () => this.showDatePicker())
    this.endInput.addEventListener('focus', () => this.showDatePicker())
    this.startInput.addEventListener('blur', () => this.handleInputBlur('start'))
    this.endInput.addEventListener('blur', () => this.handleInputBlur('end'))

    // 点击外部关闭日期选择器
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        // 只有在未选择开始日期或已完成日期范围选择时才关闭弹框
        if (!this.isSelectingEndDate) {
          this.hideDatePicker()
        }
      }
    })
  }

  private showDatePicker(): void {
    if (this.showPicker) return

    this.showPicker = true
    this.renderDatePicker()
  }

  private hideDatePicker(): void {
    if (!this.showPicker) return

    this.showPicker = false
    if (this.pickerPopup) {
      this.pickerPopup.remove()
      this.pickerPopup = null
    }
  }

  // 渲染弹框
  private renderDatePicker(): void {
    if (this.pickerPopup) {
      this.pickerPopup.remove()
    }

    this.pickerPopup = document.createElement('div')
    this.pickerPopup.className = 'picker-popup'

    const calendarWrapper = document.createElement('div')
    calendarWrapper.className = 'calendar-wrapper'

    // 渲染开始日期日历
    calendarWrapper.appendChild(this.renderCalendar('start'))
    // 渲染结束日期日历
    calendarWrapper.appendChild(this.renderCalendar('end'))

    this.pickerPopup.appendChild(calendarWrapper)
    this.container.appendChild(this.pickerPopup)
  }

  // 渲染日历
  private renderCalendar(type: 'start' | 'end'): HTMLElement {
    const calendar = document.createElement('div')
    calendar.className = 'calendar'

    // 渲染日历头部
    const header = this.renderCalendarHeader(type)
    calendar.appendChild(header)

    // 根据当前显示的面板类型渲染不同的内容
    // 年份选择面板
    if (this.showYearPicker === type) calendar.appendChild(this.renderYearPicker(type))
    // 月份选择面板
    else if (this.showMonthPicker === type) calendar.appendChild(this.renderMonthPicker(type))
    // 日期选择面板
    else {
      // 渲染星期行
      const weekRow = this.renderWeekRow()
      calendar.appendChild(weekRow)

      // 渲染日期网格
      const daysGrid = this.renderDaysGrid(type)
      calendar.appendChild(daysGrid)
    }

    return calendar
  }

  private renderCalendarHeader(type: 'start' | 'end'): HTMLElement {
    const header = document.createElement('div')
    header.className = 'calendar-header'

    const month = type === 'start' ? this.startMonth : this.endMonth

    // 添加左箭头按钮，当显示月份选择面板时禁用
    const prevBtn = document.createElement('button')
    prevBtn.textContent = '←'
    if (this.showMonthPicker === type) {
      prevBtn.disabled = true
    }
    prevBtn.onclick = (e) => {
      e.stopPropagation()
      if (this.showYearPicker === type) {
        this.yearRangeStart -= 21
      } else {
        this.changeMonth(type, 'prev')
      }
    }

    // 创建年月选择器容器
    const yearMonthSelector = document.createElement('div')
    yearMonthSelector.className = 'year-month-selector'

    // 创建年份按钮
    const yearBtn = document.createElement('button')
    yearBtn.className = 'year-month-btn'
    yearBtn.textContent = month.format('YYYY年')
    yearBtn.onclick = (e) => {
      e.stopPropagation()
      this.handleYearClick(type)
    }

    // 创建月份按钮
    const monthBtn = document.createElement('button')
    monthBtn.className = 'year-month-btn'
    monthBtn.textContent = month.format('MM月')
    monthBtn.onclick = (e) => {
      e.stopPropagation()
      this.handleMonthClick(type)
    }

    yearMonthSelector.appendChild(yearBtn)
    yearMonthSelector.appendChild(monthBtn)

    // 添加右箭头按钮，当显示月份选择面板时禁用
    const nextBtn = document.createElement('button')
    nextBtn.textContent = '→'
    if (this.showMonthPicker === type) {
      nextBtn.disabled = true
    }
    nextBtn.onclick = (e) => {
      e.stopPropagation()
      if (this.showYearPicker === type) {
        this.yearRangeStart += 21
      } else {
        this.changeMonth(type, 'next')
      }
    }

    header.appendChild(prevBtn)
    header.appendChild(yearMonthSelector)
    header.appendChild(nextBtn)

    return header
  }

  // 渲染星期行
  private renderWeekRow(): HTMLElement {
    const weekRow = document.createElement('div')
    weekRow.className = 'weekdays'

    const weekDays = getWeekDays(this.dayStartOfWeek)
    weekDays.forEach((day) => {
      const weekDay = document.createElement('span')
      weekDay.className = 'weekday'
      weekDay.textContent = day
      weekRow.appendChild(weekDay)
    })

    return weekRow
  }

  // 渲染日期网格
  private renderDaysGrid(type: 'start' | 'end'): HTMLElement {
    const grid = document.createElement('div')
    grid.className = 'days-grid'

    const month = type === 'start' ? this.startMonth : this.endMonth
    const days = getMonthDays(month, this.dayStartOfWeek)

    days.forEach((day) => {
      const dayCell = document.createElement('button')
      dayCell.className = 'day-cell'
      dayCell.textContent = day.date().toString()

      // 添加日期单元格的样式类
      const classes = getDateClass(day, month, this.selectedStartDate, this.selectedEndDate)
      Object.entries(classes).forEach(([className, value]) => {
        if (value) dayCell.classList.add(className)
      })

      dayCell.onclick = () => this.handleDateClick(day, month)
      grid.appendChild(dayCell)
    })

    return grid
  }

  private handleDateClick(date: Dayjs, currentDisplayMonth: Dayjs): void {
    // 如果点击的不是当前月份的日期，则不处理
    if (date.month() !== currentDisplayMonth.month()) return

    if (!this.isSelectingEndDate) {
      // 选择开始日期时，只更新状态，不关闭弹框
      this.selectedStartDate = date
      this.selectedEndDate = null
      this.startInput.value = date.format(FORMAT)
      this.endInput.value = ''
      this.isSelectingEndDate = true
    } else {
      // 选择结束日期时
      if (date.isBefore(this.selectedStartDate!)) {
        // 如果选择的结束日期在开始日期之前，交换它们
        this.selectedEndDate = this.selectedStartDate
        this.selectedStartDate = date
        this.startInput.value = date.format(FORMAT)
        this.endInput.value = this.selectedEndDate!.format(FORMAT)
      } else {
        this.selectedEndDate = date
        this.endInput.value = date.format(FORMAT)
      }

      // 更新状态并关闭弹框
      this.isSelectingEndDate = false
      this.updateDateRange()
      this.hideDatePicker() // 在选择完结束日期后关闭弹框
      return // 直接返回，不需要重新渲染
    }

    // 只在选择开始日期时重新渲染
    this.renderDatePicker()
  }

  private changeMonth(type: 'start' | 'end', direction: 'prev' | 'next'): void {
    if (type === 'start') {
      this.startMonth = direction === 'prev'
        ? this.startMonth.subtract(1, 'month')
        : this.startMonth.add(1, 'month')

      if (this.startMonth.isSameOrAfter(this.endMonth)) {
        this.endMonth = this.startMonth.add(1, 'month')
      }
    } else {
      this.endMonth = direction === 'prev'
        ? this.endMonth.subtract(1, 'month')
        : this.endMonth.add(1, 'month')

      if (this.endMonth.isSameOrBefore(this.startMonth)) {
        this.startMonth = this.endMonth.subtract(1, 'month')
      }
    }

    this.renderDatePicker()
  }

  private handleInputBlur(type: 'start' | 'end'): void {
    const input = type === 'start' ? this.startInput : this.endInput
    const text = input.value.trim()

    if (!text) {
      if (type === 'start') {
        this.selectedStartDate = null
      } else {
        this.selectedEndDate = null
      }
      input.value = ''
      this.updateDateRange()
      return
    }

    const date = dayjs(text, FORMAT)
    if (!date.isValid()) {
      input.value = type === 'start'
        ? this.selectedStartDate?.format(FORMAT) || ''
        : this.selectedEndDate?.format(FORMAT) || ''
      return
    }

    if (type === 'start') {
      if (this.selectedEndDate && date.isAfter(this.selectedEndDate)) {
        input.value = this.selectedStartDate?.format(FORMAT) || ''
        return
      }
      this.selectedStartDate = date
    } else {
      if (this.selectedStartDate && date.isBefore(this.selectedStartDate)) {
        input.value = this.selectedEndDate?.format(FORMAT) || ''
        return
      }
      this.selectedEndDate = date
    }

    this.updateDateRange()
  }

  private updateDateRange(): void {
    if (this.selectedStartDate && this.selectedEndDate && this.onChange) {
      this.onChange([
        this.selectedStartDate.toDate(),
        this.selectedEndDate.toDate(),
      ])
    }
  }

  public setValue(value: [Date | null, Date | null]): void {
    const [start, end] = value

    if (start) {
      this.selectedStartDate = dayjs(start)
      this.startInput.value = this.selectedStartDate.format(FORMAT)
    } else {
      this.selectedStartDate = null
      this.startInput.value = ''
    }

    if (end) {
      this.selectedEndDate = dayjs(end)
      this.endInput.value = this.selectedEndDate.format(FORMAT)
    } else {
      this.selectedEndDate = null
      this.endInput.value = ''
    }
  }

  public destroy(): void {
    this.element.removeChild(this.container)
  }

  private renderYearPicker(type: 'start' | 'end'): HTMLElement {
    const yearPicker = document.createElement('div')
    yearPicker.className = 'year-picker'

    // 年份网格
    const yearGrid = document.createElement('div')
    yearGrid.className = 'year-grid'

    // 显示从 yearRangeStart 开始的15年
    for (let i = this.yearRangeStart; i < this.yearRangeStart + 15; i++) {
      const yearCell = document.createElement('button')
      yearCell.className = 'year-cell'
      yearCell.textContent = i.toString()

      const month = type === 'start' ? this.startMonth : this.endMonth
      if (i === month.year()) {
        yearCell.classList.add('selected')
      }

      yearCell.onclick = (e) => {
        e.stopPropagation()
        this.handleYearSelect(i, type)
      }
      yearGrid.appendChild(yearCell)
    }

    yearPicker.appendChild(yearGrid)
    return yearPicker
  }

  private renderMonthPicker(type: 'start' | 'end'): HTMLElement {
    const monthPicker = document.createElement('div')
    monthPicker.className = 'month-picker'

    const monthGrid = document.createElement('div')
    monthGrid.className = 'month-grid'

    for (let i = 0; i < 12; i++) {
      const monthCell = document.createElement('button')
      monthCell.className = 'month-cell'
      monthCell.textContent = `${i + 1}月`

      const month = type === 'start' ? this.startMonth : this.endMonth
      if (i === month.month()) {
        monthCell.classList.add('selected')
      }

      monthCell.onclick = (e) => {
        e.stopPropagation()
        this.handleMonthSelect(i, type)
      }
      monthGrid.appendChild(monthCell)
    }

    monthPicker.appendChild(monthGrid)
    return monthPicker
  }

  private handleYearClick(type: 'start' | 'end'): void {
    this.showMonthPicker = null
    this.showYearPicker = type
    this.renderDatePicker()
  }

  private handleMonthClick(type: 'start' | 'end'): void {
    this.showYearPicker = null
    this.showMonthPicker = type
    this.renderDatePicker()
  }

  private handleYearSelect(year: number, type: 'start' | 'end'): void {
    if (type === 'start') {
      this.startMonth = this.startMonth.year(year)
      if (this.startMonth.isSameOrAfter(this.endMonth)) {
        this.endMonth = this.startMonth.add(1, 'month')
      }
    } else {
      this.endMonth = this.endMonth.year(year)
      if (this.endMonth.isSameOrBefore(this.startMonth)) {
        this.startMonth = this.endMonth.subtract(1, 'month')
      }
    }
    this.showYearPicker = null
    this.renderDatePicker()
  }

  private handleMonthSelect(month: number, type: 'start' | 'end'): void {
    if (type === 'start') {
      this.startMonth = this.startMonth.month(month)
      if (this.startMonth.isSameOrAfter(this.endMonth)) {
        this.endMonth = this.startMonth.add(1, 'month')
      }
    } else {
      this.endMonth = this.endMonth.month(month)
      if (this.endMonth.isSameOrBefore(this.startMonth)) {
        this.startMonth = this.endMonth.subtract(1, 'month')
      }
    }
    this.showMonthPicker = null
    this.renderDatePicker()
  }
}
