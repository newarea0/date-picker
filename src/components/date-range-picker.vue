<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { computed, ref, watch } from 'vue'
import { clickOutside } from '../directives/click-outside'

const props = withDefaults(defineProps<Props>(), {
  startDay: 0,
  format: 'YYYY-MM-DD',
})
const emit = defineEmits<{
  'update:modelValue': [value: [Date | null, Date | null]]
  'change': [value: [Date | null, Date | null]]
}>()
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface Props {
  modelValue: [Date | null, Date | null]
  startDay?: number
  minDate?: Date
  maxDate?: Date
  format?: string
}

const showPicker = ref(false)
const startDateText = ref('')
const endDateText = ref('')
const hasError = ref(false)
const currentMonth = ref<Dayjs>(dayjs())
const selectedStartDate = ref<Dayjs | null>(null)
const selectedEndDate = ref<Dayjs | null>(null)
const isSelectingEndDate = ref(false)

// Add the directive registration
const vClickOutside = clickOutside

// 计算周显示
const weekDays = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return [...days.slice(props.startDay), ...days.slice(0, props.startDay)]
})

// 计算当前月的日期网格
const daysInMonth = computed(() => {
  const firstDay = currentMonth.value.startOf('month')
  const lastDay = currentMonth.value.endOf('month')
  const days: Dayjs[] = []

  // 填充上个月的日期
  const firstDayOfWeek = firstDay.day()
  const prevMonthDays = (firstDayOfWeek - props.startDay + 7) % 7
  for (let i = prevMonthDays - 1; i >= 0; i--)
    days.push(firstDay.subtract(i + 1, 'day'))

  // 当前月的日期
  for (let i = 0; i < lastDay.date(); i++)
    days.push(firstDay.add(i, 'day'))

  // 填充下个月的日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++)
    days.push(lastDay.add(i, 'day'))

  return days
})

function validateInput(type: 'start' | 'end'): void {
  const text = type === 'start' ? startDateText.value : endDateText.value
  const date = dayjs(text, props.format)
  hasError.value = !date.isValid()

  if (!hasError.value)
    updateDateRange()
}

function updateDateRange(): void {
  const startDate = dayjs(startDateText.value, props.format).toDate()
  const endDate = dayjs(endDateText.value, props.format).toDate()

  if (startDate && endDate && startDate > endDate) {
    hasError.value = true
    return
  }

  emit('update:modelValue', [startDate, endDate])
  emit('change', [startDate, endDate])
}

function handleDateClick(date: Dayjs): void {
  if (!isSelectingEndDate.value) {
    // 选择开始日期
    selectedStartDate.value = date
    selectedEndDate.value = null
    isSelectingEndDate.value = true
    startDateText.value = date.format(props.format)
  }
  else {
    // 选择结束日期
    if (date.isBefore(selectedStartDate.value)) {
      // 如果选择的结束日期在开始日期之前，交换它们
      selectedEndDate.value = selectedStartDate.value
      selectedStartDate.value = date
      startDateText.value = date.format(props.format)
      endDateText.value = selectedEndDate.value.format(props.format)
    }
    else {
      selectedEndDate.value = date
      endDateText.value = date.format(props.format)
    }

    isSelectingEndDate.value = false
    updateDateRange()
    showPicker.value = false
  }
}

function getDateClass(day: Dayjs, currentDisplayMonth: Dayjs) {
  const isSelected = selectedStartDate.value?.isSame(day, 'day')
    || selectedEndDate.value?.isSame(day, 'day')
  const isInRange = selectedStartDate.value
    && selectedEndDate.value
    && day.isAfter(selectedStartDate.value, 'day')
    && day.isBefore(selectedEndDate.value, 'day')
  const isDisabled = (props.minDate && day.isBefore(props.minDate, 'day'))
    || (props.maxDate && day.isAfter(props.maxDate, 'day'))
  const isOtherMonth = day.month() !== currentDisplayMonth.month()
  const isStartDate = selectedStartDate.value?.isSame(day, 'day')
  const isEndDate = selectedEndDate.value?.isSame(day, 'day')

  return {
    'selected': isSelected,
    'in-range': isInRange,
    'disabled': isDisabled,
    'other-month': isOtherMonth,
    'start-date': isStartDate,
    'end-date': isEndDate,
  }
}

function prevMonth(): void {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
}

function nextMonth(): void {
  currentMonth.value = currentMonth.value.add(1, 'month')
}

function closePicker(): void {
  showPicker.value = false
}

function togglePicker(event: Event): void {
  // 阻止事件冒泡
  event.stopPropagation()
  showPicker.value = !showPicker.value
}

function handleInputFocus(event: Event): void {
  event.stopPropagation()
  showPicker.value = true
}

// 更新 watch 以处理 modelValue 的变化
watch(() => props.modelValue, ([start, end]) => {
  if (start) {
    selectedStartDate.value = dayjs(start)
    startDateText.value = selectedStartDate.value.format(props.format)
  }
  else {
    selectedStartDate.value = null
    startDateText.value = ''
  }

  if (end) {
    selectedEndDate.value = dayjs(end)
    endDateText.value = selectedEndDate.value.format(props.format)
  }
  else {
    selectedEndDate.value = null
    endDateText.value = ''
  }
}, { immediate: true })

// 修改月份状态管理
const startMonth = ref<Dayjs>(dayjs())
const endMonth = ref<Dayjs>(dayjs().add(1, 'month'))

// 计算开始月份的日期网格
const startMonthDays = computed(() => {
  return getMonthDays(startMonth.value)
})

// 计算结束月份的日期网格
const endMonthDays = computed(() => {
  return getMonthDays(endMonth.value)
})

// 提取日期网格计算逻辑到独立函数
function getMonthDays(month: Dayjs) {
  const firstDay = month.startOf('month')
  const lastDay = month.endOf('month')
  const days: Dayjs[] = []

  // 填充上个月的日期
  const firstDayOfWeek = firstDay.day()
  const prevMonthDays = (firstDayOfWeek - props.startDay + 7) % 7
  for (let i = prevMonthDays - 1; i >= 0; i--)
    days.push(firstDay.subtract(i + 1, 'day'))

  // 当前月的日期
  for (let i = 0; i < lastDay.date(); i++)
    days.push(firstDay.add(i, 'day'))

  // 填充下个月的日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++)
    days.push(lastDay.add(i, 'day'))

  return days
}

// 月份导航函数
function prevStartMonth(): void {
  startMonth.value = startMonth.value.subtract(1, 'month')
  if (startMonth.value.isSameOrAfter(endMonth.value))
    endMonth.value = startMonth.value.add(1, 'month')
}

function nextStartMonth(): void {
  startMonth.value = startMonth.value.add(1, 'month')
  if (startMonth.value.isSameOrAfter(endMonth.value))
    endMonth.value = startMonth.value.add(1, 'month')
}

function prevEndMonth(): void {
  endMonth.value = endMonth.value.subtract(1, 'month')
  if (endMonth.value.isSameOrBefore(startMonth.value))
    startMonth.value = endMonth.value.subtract(1, 'month')
}

function nextEndMonth(): void {
  endMonth.value = endMonth.value.add(1, 'month')
}

// 添加年月选择的状态
const showYearPicker = ref<'start' | 'end' | null>(null)
const showMonthPicker = ref<'start' | 'end' | null>(null)

// 生成年份列表
const yearList = computed(() => {
  const currentYear = dayjs().year()
  const years: number[] = []
  // 显示前后10年
  for (let i = currentYear - 10; i <= currentYear + 10; i++)
    years.push(i)
  return years
})

// 月份列表
const monthList = computed(() => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${i + 1}月`,
  }))
})

// 处理年份选择
function handleYearSelect(year: number, type: 'start' | 'end'): void {
  if (type === 'start') {
    startMonth.value = startMonth.value.year(year)
    if (startMonth.value.isSameOrAfter(endMonth.value))
      endMonth.value = startMonth.value.add(1, 'month')
  }
  else {
    endMonth.value = endMonth.value.year(year)
    if (endMonth.value.isSameOrBefore(startMonth.value))
      startMonth.value = endMonth.value.subtract(1, 'month')
  }
  showYearPicker.value = null
}

// 处理月份选择
function handleMonthSelect(month: number, type: 'start' | 'end'): void {
  if (type === 'start') {
    startMonth.value = startMonth.value.month(month)
    if (startMonth.value.isSameOrAfter(endMonth.value))
      endMonth.value = startMonth.value.add(1, 'month')
  }
  else {
    endMonth.value = endMonth.value.month(month)
    if (endMonth.value.isSameOrBefore(startMonth.value))
      startMonth.value = endMonth.value.subtract(1, 'month')
  }
  showMonthPicker.value = null
}
</script>

<template>
  <div class="date-range-picker" @click.stop>
    <div class="input-wrapper">
      <input
        v-model="startDateText"
        type="text"
        :placeholder="format"
        @focus="handleInputFocus"
        @click.stop
        @input="validateInput('start')"
      >
      <span class="separator">至</span>
      <input
        v-model="endDateText"
        type="text"
        :placeholder="format"
        @focus="handleInputFocus"
        @click.stop
        @input="validateInput('end')"
      >
      <CalendarOutlined
        class="calendar-icon"
        @click="togglePicker"
      />
      <div
        v-if="hasError"
        class="error-icon"
        title="格式不正确"
      >
        ⚠️
      </div>
    </div>

    <Transition name="slide-fade">
      <div
        v-if="showPicker"
        v-click-outside="closePicker"
        class="picker-popup"
        @click.stop
      >
        <div class="calendar-wrapper">
          <!-- 开始日期日历 -->
          <div class="calendar">
            <div class="calendar-header">
              <button @click="prevStartMonth">
                ←
              </button>
              <div class="year-month-selector">
                <button
                  class="year-month-btn"
                  @click="showYearPicker = 'start'"
                >
                  {{ startMonth.format('YYYY年') }}
                </button>
                <button
                  class="year-month-btn"
                  @click="showMonthPicker = 'start'"
                >
                  {{ startMonth.format('MM月') }}
                </button>
              </div>
              <button @click="nextStartMonth">
                →
              </button>
            </div>

            <!-- 年份选择面板 -->
            <div
              v-if="showYearPicker === 'start'"
              class="year-picker"
            >
              <div class="year-grid">
                <button
                  v-for="year in yearList"
                  :key="year"
                  class="year-cell"
                  :class="{ 'selected': year === startMonth.year() }"
                  @click="handleYearSelect(year, 'start')"
                >
                  {{ year }}
                </button>
              </div>
            </div>

            <!-- 月份选择面板 -->
            <div
              v-else-if="showMonthPicker === 'start'"
              class="month-picker"
            >
              <div class="month-grid">
                <button
                  v-for="month in monthList"
                  :key="month.value"
                  class="month-cell"
                  :class="{ 'selected': month.value === startMonth.month() }"
                  @click="handleMonthSelect(month.value, 'start')"
                >
                  {{ month.label }}
                </button>
              </div>
            </div>

            <!-- 日期网格 -->
            <template v-else>
              <div class="weekdays">
                <span
                  v-for="day in weekDays"
                  :key="day"
                  class="weekday"
                >
                  {{ day }}
                </span>
              </div>
              <div class="days-grid">
                <button
                  v-for="day in startMonthDays"
                  :key="day.valueOf()"
                  class="day-cell"
                  :class="getDateClass(day, startMonth)"
                  :disabled="(props.minDate && day.isBefore(props.minDate, 'day'))
                    || (props.maxDate && day.isAfter(props.maxDate, 'day'))"
                  @click="handleDateClick(day)"
                >
                  {{ day.date() }}
                </button>
              </div>
            </template>
          </div>

          <!-- 结束日期日历 -->
          <div class="calendar">
            <div class="calendar-header">
              <button @click="prevEndMonth">
                ←
              </button>
              <div class="year-month-selector">
                <button
                  class="year-month-btn"
                  @click="showYearPicker = 'end'"
                >
                  {{ endMonth.format('YYYY年') }}
                </button>
                <button
                  class="year-month-btn"
                  @click="showMonthPicker = 'end'"
                >
                  {{ endMonth.format('MM月') }}
                </button>
              </div>
              <button @click="nextEndMonth">
                →
              </button>
            </div>

            <!-- 年份选择面板 -->
            <div
              v-if="showYearPicker === 'end'"
              class="year-picker"
            >
              <div class="year-grid">
                <button
                  v-for="year in yearList"
                  :key="year"
                  class="year-cell"
                  :class="{ 'selected': year === endMonth.year() }"
                  @click="handleYearSelect(year, 'end')"
                >
                  {{ year }}
                </button>
              </div>
            </div>

            <!-- 月份选择面板 -->
            <div
              v-else-if="showMonthPicker === 'end'"
              class="month-picker"
            >
              <div class="month-grid">
                <button
                  v-for="month in monthList"
                  :key="month.value"
                  class="month-cell"
                  :class="{ 'selected': month.value === endMonth.month() }"
                  @click="handleMonthSelect(month.value, 'end')"
                >
                  {{ month.label }}
                </button>
              </div>
            </div>

            <!-- 日期网格 -->
            <template v-else>
              <div class="weekdays">
                <span
                  v-for="day in weekDays"
                  :key="day"
                  class="weekday"
                >
                  {{ day }}
                </span>
              </div>
              <div class="days-grid">
                <button
                  v-for="day in endMonthDays"
                  :key="day.valueOf()"
                  class="day-cell"
                  :class="getDateClass(day, endMonth)"
                  :disabled="(props.minDate && day.isBefore(props.minDate, 'day'))
                    || (props.maxDate && day.isAfter(props.maxDate, 'day'))"
                  @click="handleDateClick(day)"
                >
                  {{ day.date() }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.date-range-picker {
  position: relative;
  width: 300px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    'Noto Sans', sans-serif;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 4px 11px;
  transition: all 0.3s;
}

.input-wrapper:hover {
  border-color: #4096ff;
}

.input-wrapper:focus-within {
  border-color: #4096ff;
  box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
}

.separator {
  margin: 0 8px;
  color: #999;
}

input {
  border: none;
  outline: none;
  width: 100px;
  padding: 4px;
  font-size: 14px;
}

.calendar-icon {
  margin-left: 8px;
  color: #999;
  cursor: pointer;
}

.calendar-icon:hover {
  color: #4096ff;
}

.error-icon {
  margin-left: 8px;
  color: #ff4d4f;
  cursor: pointer;
}

.picker-popup {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08);
  z-index: 1000;
  min-width: 576px; /* 调整宽度以适应两个日历 */
}

.calendar-wrapper {
  display: flex;
  gap: 16px;
  padding: 8px;
}

.calendar {
  width: 280px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 8px;
}

.calendar-header button {
  border: none;
  background: none;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
}

.calendar-header button:hover {
  background: #f5f5f5;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.weekday {
  color: #999;
  font-size: 14px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  position: relative;
}

.day-cell:hover:not(.disabled):not(.selected) {
  background: #f5f5f5;
}

.day-cell.other-month {
  color: rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.day-cell.disabled {
  color: #d9d9d9;
  cursor: not-allowed;
  background: #f5f5f5;
}

.day-cell.selected {
  color: #fff;
  background: #1890ff;
}

.day-cell.in-range {
  background: #e6f7ff;
  color: #1890ff;
}

.day-cell.start-date {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.day-cell.end-date {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.day-cell.start-date::after,
.day-cell.end-date::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: #e6f7ff;
  z-index: -1;
}

.day-cell.start-date::after {
  right: 0;
}

.day-cell.end-date::after {
  left: 0;
}

/* 动画效果 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.year-month-selector {
  display: flex;
  gap: 8px;
}

.year-month-btn {
  padding: 4px 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.year-month-btn:hover {
  background: #f5f5f5;
}

.year-picker,
.month-picker {
  padding: 8px;
}

.year-grid,
.month-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
}

.year-cell,
.month-cell {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.year-cell:hover,
.month-cell:hover {
  background: #f5f5f5;
}

.year-cell.selected,
.month-cell.selected {
  background: #1890ff;
  color: white;
}
</style>
