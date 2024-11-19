<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import { CalendarOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'
import { clickOutside } from '../directives/click-outside'

interface Props {
  modelValue: [Date | null, Date | null]
  startDay?: number
  minDate?: Date
  maxDate?: Date
  format?: string
}

const props = withDefaults(defineProps<Props>(), {
  startDay: 0,
  format: 'YYYY-MM-DD',
})

const emit = defineEmits<{
  'update:modelValue': [value: [Date | null, Date | null]]
  'change': [value: [Date | null, Date | null]]
}>()

const showPicker = ref(false)
const startDateText = ref('')
const endDateText = ref('')
const hasError = ref(false)
const currentMonth = ref<Dayjs>(dayjs())

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
  // 实现日期选择逻辑
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
          <div class="calendar">
            <div class="calendar-header">
              <button @click="prevMonth">
                ←
              </button>
              <span>{{ currentMonth.format('YYYY年MM月') }}</span>
              <button @click="nextMonth">
                →
              </button>
            </div>
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
                v-for="day in daysInMonth"
                :key="day.valueOf()"
                class="day-cell"
                :class="{
                  'other-month': day.month() !== currentMonth.month(),
                }"
                @click="handleDateClick(day)"
              >
                {{ day.date() }}
              </button>
            </div>
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
}

.calendar-wrapper {
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
}

.day-cell:hover {
  background: #f5f5f5;
}

.day-cell.other-month {
  color: #d9d9d9;
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
</style>
