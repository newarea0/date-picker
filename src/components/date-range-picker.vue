<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import { FORMAT } from '@/constants'
import { CalendarOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { computed, ref, watch } from 'vue'
import { clickOutside as vClickOutside } from '../directives/click-outside'

const props = withDefaults(defineProps<Props>(), {
  dayStartOfWeek: 0,
})
const emit = defineEmits<{
  'update:modelValue': [value: [Date | null, Date | null]]
  'change': [value: [Date | null, Date | null]]
}>()
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface Props {
  modelValue: [Date | null, Date | null]
  // 周开始日，0为周日，1为周一
  dayStartOfWeek?: number
}

// 控制弹框的显示/隐藏
const showPicker = ref(false)
// 开始日期输入框的值
const startDateText = ref('')
// 结束日期输入框的值
const endDateText = ref('')
// 输入框是否错误
const hasError = ref(false)
// 选中的开始日期
const selectedStartDate = ref<Dayjs | null>(null)
// 选中的结束日期
const selectedEndDate = ref<Dayjs | null>(null)
// 是否在选择结束日期
const isSelectingEndDate = ref(false)

// 根据周开始日计算周显示
const weekDays = computed(() => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return [...days.slice(props.dayStartOfWeek), ...days.slice(0, props.dayStartOfWeek)]
})

// 验证输入框的值
function validateInput(type: 'start' | 'end'): void {
  const text = type === 'start' ? startDateText.value : endDateText.value
  const date = dayjs(text, FORMAT)

  // 检查日期是否有效
  if (!date.isValid()) {
    hasError.value = true
    return
  }

  // 更新选中的日期
  if (type === 'start') {
    selectedStartDate.value = date
    // 如果已经有结束日期，检查顺序
    if (selectedEndDate.value && date.isAfter(selectedEndDate.value)) {
      hasError.value = true
      return
    }
  } else {
    selectedEndDate.value = date
    // 如果已经有开始日期，检查顺序
    if (selectedStartDate.value && date.isBefore(selectedStartDate.value)) {
      hasError.value = true
      return
    }
  }

  hasError.value = false
  updateDateRange()
}

// 更新日期范围
function updateDateRange(): void {
  if (hasError.value)
    return

  let startDate: Date | null = null
  let endDate: Date | null = null

  if (selectedStartDate.value)
    startDate = selectedStartDate.value.toDate()

  if (selectedEndDate.value)
    endDate = selectedEndDate.value.toDate()

  // 只有当两个日期都有效或都为空时才更新
  if ((startDate && endDate) || (!startDate && !endDate)) {
    emit('update:modelValue', [startDate, endDate])
    emit('change', [startDate, endDate])
  }
}

// 添加输入框失焦事件处理
function handleInputBlur(type: 'start' | 'end'): void {
  const text = type === 'start' ? startDateText.value : endDateText.value

  // 如果输入框为空，清除对应的日期
  if (!text.trim()) {
    if (type === 'start') {
      selectedStartDate.value = null
      startDateText.value = ''
    } else {
      selectedEndDate.value = null
      endDateText.value = ''
    }
    hasError.value = false
    updateDateRange()
    return
  }

  // 验证输入
  validateInput(type)

  // 如果验证失败，恢复为之前的有效值
  if (hasError.value) {
    if (type === 'start') {
      startDateText.value = selectedStartDate.value
        ? selectedStartDate.value.format(FORMAT)
        : ''
    } else {
      endDateText.value = selectedEndDate.value
        ? selectedEndDate.value.format(FORMAT)
        : ''
    }
  }
}

// 处理日期点击事件
function handleDateClick(date: Dayjs, currentDisplayMonth: Dayjs): void {
  // 如果点击的不是当前月份的日期，则不处理
  if (date.month() !== currentDisplayMonth.month())
    return

  if (!isSelectingEndDate.value) {
    // 选择开始日期
    selectedStartDate.value = date
    selectedEndDate.value = null
    isSelectingEndDate.value = true
    startDateText.value = date.format(FORMAT)
  } else {
    // 选择结束日期
    if (date.isBefore(selectedStartDate.value)) {
      // 如果选择的结束日期在开始日期之前，交换它们
      selectedEndDate.value = selectedStartDate.value
      selectedStartDate.value = date
      startDateText.value = date.format(FORMAT)
      endDateText.value = selectedEndDate.value.format(FORMAT)
    } else {
      selectedEndDate.value = date
      endDateText.value = date.format(FORMAT)
    }

    isSelectingEndDate.value = false
    updateDateRange()
    showPicker.value = false
  }
}

// 获取日期单元格的样式
function getDateClass(day: Dayjs, currentDisplayMonth: Dayjs) {
  const isCurrentMonth = day.month() === currentDisplayMonth.month()
  const isSelected = selectedStartDate.value?.isSame(day, 'day')
    || selectedEndDate.value?.isSame(day, 'day')
  const isInRange = selectedStartDate.value
    && selectedEndDate.value
    && day.isAfter(selectedStartDate.value, 'day')
    && day.isBefore(selectedEndDate.value, 'day')
    && isCurrentMonth // 只有当前月份的日期才显示范围样式
  const isOtherMonth = !isCurrentMonth
  const isStartDate = selectedStartDate.value?.isSame(day, 'day') && isCurrentMonth
  const isEndDate = selectedEndDate.value?.isSame(day, 'day') && isCurrentMonth

  return {
    'selected': isSelected && isCurrentMonth, // 只有当前月份的日期才能被选中
    'in-range': isInRange,
    'other-month': isOtherMonth,
    'start-date': isStartDate,
    'end-date': isEndDate,
    'current-month': isCurrentMonth,
  }
}

// 关闭弹框
function closePicker(): void {
  showPicker.value = false
}

// 切换弹框的显示/隐藏
function togglePicker(event: Event): void {
  // 阻止事件冒泡
  event.stopPropagation()
  showPicker.value = !showPicker.value
}

// 处理输入框聚焦事件
function handleInputFocus(event: Event): void {
  event.stopPropagation()
  showPicker.value = true
}

// 更新 watch 以处理 modelValue 的变化
watch(() => props.modelValue, ([start, end]) => {
  if (start) {
    selectedStartDate.value = dayjs(start)
    startDateText.value = selectedStartDate.value.format(FORMAT)
  } else {
    selectedStartDate.value = null
    startDateText.value = ''
  }

  if (end) {
    selectedEndDate.value = dayjs(end)
    endDateText.value = selectedEndDate.value.format(FORMAT)
  } else {
    selectedEndDate.value = null
    endDateText.value = ''
  }
}, { immediate: true })

// 弹框中开始日期月份，默认当前时间
const startMonth = ref<Dayjs>(dayjs())
// 弹框中结束日期月份
const endMonth = ref<Dayjs>(dayjs().add(1, 'month'))

// 计算开始月份的日期网格
const startMonthDays = computed(() => getMonthDays(startMonth.value))

// 计算结束月份的日期网格
const endMonthDays = computed(() => getMonthDays(endMonth.value))

// 提取日期网格计算逻辑到独立函数
function getMonthDays(month: Dayjs) {
  const firstDay = month.startOf('month')
  const lastDay = month.endOf('month')
  const days: Dayjs[] = []

  // 填充上个月的日期
  const firstDayOfWeek = firstDay.day()
  const prevMonthDays = (firstDayOfWeek - props.dayStartOfWeek + 7) % 7
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

// 下一月
function nextStartMonth(): void {
  startMonth.value = startMonth.value.add(1, 'month')
  if (startMonth.value.isSameOrAfter(endMonth.value))
    endMonth.value = startMonth.value.add(1, 'month')
}

// 上一月
function prevEndMonth(): void {
  endMonth.value = endMonth.value.subtract(1, 'month')
  if (endMonth.value.isSameOrBefore(startMonth.value))
    startMonth.value = endMonth.value.subtract(1, 'month')
}

// 下一月
function nextEndMonth(): void {
  endMonth.value = endMonth.value.add(1, 'month')
}

// 控制年份选择面板的显示/隐藏
const showYearPicker = ref<'start' | 'end' | null>(null)
// 控制月份选择面板的显示/隐藏
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
    if (startMonth.value.isSameOrAfter(endMonth.value)) endMonth.value = startMonth.value.add(1, 'month')
  } else {
    endMonth.value = endMonth.value.year(year)
    if (endMonth.value.isSameOrBefore(startMonth.value)) startMonth.value = endMonth.value.subtract(1, 'month')
  }
  showYearPicker.value = null
}

// 处理月份选择
function handleMonthSelect(month: number, type: 'start' | 'end'): void {
  if (type === 'start') {
    startMonth.value = startMonth.value.month(month)
    if (startMonth.value.isSameOrAfter(endMonth.value)) endMonth.value = startMonth.value.add(1, 'month')
  } else {
    endMonth.value = endMonth.value.month(month)
    if (endMonth.value.isSameOrBefore(startMonth.value)) startMonth.value = endMonth.value.subtract(1, 'month')
  }
  showMonthPicker.value = null
}

// 处理年份点击事件
function handleYearClick(type: 'start' | 'end'): void {
  showMonthPicker.value = null
  showYearPicker.value = type
}

// 处理月份点击事件
function handleMonthClick(type: 'start' | 'end'): void {
  showYearPicker.value = null
  showMonthPicker.value = type
}
</script>

<template>
  <div class="date-range-picker" @click.stop>
    <!-- 日期输入框 -->
    <div class="input-wrapper">
      <!-- 开始日期 -->
      <input
        v-model="startDateText"
        type="text"
        :placeholder="FORMAT"
        @focus="handleInputFocus"
        @blur="handleInputBlur('start')"
        @click.stop
        @input="validateInput('start')"
      >
      <!-- 日期分隔符 -->
      <span class="separator">至</span>
      <!-- 结束日期 -->
      <input
        v-model="endDateText"
        type="text"
        :placeholder="FORMAT"
        @focus="handleInputFocus"
        @blur="handleInputBlur('end')"
        @click.stop
        @input="validateInput('end')"
      >
      <!-- 日历图标 -->
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

    <!-- 日期选择弹框 -->
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
              <button @click="prevStartMonth">←</button>
              <div class="year-month-selector">
                <button class="year-month-btn" @click="handleYearClick('start')">{{ startMonth.format('YYYY年') }}</button>
                <button class="year-month-btn" @click="handleMonthClick('start')">{{ startMonth.format('MM月') }}</button>
              </div>
              <button @click="nextStartMonth">→</button>
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
                  :class="{ selected: year === startMonth.year() }"
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
                  :class="{ selected: month.value === startMonth.month() }"
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
                  :disabled="day.month() !== startMonth.month()"
                  @click="handleDateClick(day, startMonth)"
                >
                  {{ day.date() }}
                </button>
              </div>
            </template>
          </div>

          <!-- 结束日期日历 -->
          <div class="calendar">
            <div class="calendar-header">
              <button @click="prevEndMonth">←</button>
              <div class="year-month-selector">
                <button class="year-month-btn" @click="handleYearClick('end')">{{ endMonth.format('YYYY年') }}</button>
                <button class="year-month-btn" @click="handleMonthClick('end')">{{ endMonth.format('MM月') }}</button>
              </div>
              <button @click="nextEndMonth">→</button>
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
                  :class="{ selected: year === endMonth.year() }"
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
                  :class="{ selected: month.value === endMonth.month() }"
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
                  :disabled="day.month() !== endMonth.month()"
                  @click="handleDateClick(day, endMonth)"
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
  cursor: help;
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
  color: rgba(0, 0, 0, 0.25); /* 默认颜色设置为浅灰色 */
}

.day-cell.current-month {
  color: rgba(0, 0, 0, 0.88); /* 当前月份的日期显示为正常颜色 */
}

.day-cell:hover:not(.disabled):not(.selected):not(.other-month) {
  background: #f5f5f5;
}

.day-cell.other-month {
  pointer-events: none; /* 禁止点击其他月份的日期 */
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

.error-icon {
  margin-left: 8px;
  color: #ff4d4f;
  cursor: help;
}

input.error {
  border-color: #ff4d4f;
}

.input-wrapper.has-error {
  border-color: #ff4d4f;
}

.input-wrapper.has-error:hover,
.input-wrapper.has-error:focus-within {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
}
</style>
