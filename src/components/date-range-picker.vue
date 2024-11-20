<script setup lang="ts">
import type { Dayjs } from 'dayjs'
import { FORMAT } from '@/constants'
import { clickOutside as vClickOutside } from '@/directives/click-outside'
import { getMonthDays, getWeekDays } from '@/utils/date'
import { CalendarOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

interface Props {
  modelValue: [Date | null, Date | null]
  // 周开始日，0为周日，1为周一
  dayStartOfWeek?: number
}

const props = withDefaults(defineProps<Props>(), {
  dayStartOfWeek: 0,
})
const emit = defineEmits<{
  'update:modelValue': [value: [Date | null, Date | null]]
}>()
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

// 控制弹框的显示/隐藏
const showPicker = ref(false)
// 控制年份选择面板的显示/隐藏
const showYearPicker = ref<'start' | 'end' | null>(null)
// 控制月份选择面板的显示/隐藏
const showMonthPicker = ref<'start' | 'end' | null>(null)
// 开始日期输入框的值
const startDateText = ref('')
// 结束日期输入框的值
const endDateText = ref('')
// 输入框是否错误
const hasError = ref(false)
// 是否在选择结束日期
const isSelectingEndDate = ref(false)
// 用来存放开始日期的年、月，默认当前时间的年、月
const startMonth = ref<Dayjs>(dayjs())
// 用来存放结束日期的年、月，默认当前时间的年、月加1个月
const endMonth = ref<Dayjs>(dayjs().add(1, 'month'))
// 选中的开始日期
const selectedStartDate = ref<Dayjs | null>(null)
// 选中的结束日期
const selectedEndDate = ref<Dayjs | null>(null)

// 根据周开始日计算周显示
const weekDays = computed(() => getWeekDays(props.dayStartOfWeek))
// 计算开始月份的日期网格
const startMonthDays = computed(() => getMonthDays(startMonth.value, props.dayStartOfWeek))
// 计算结束月份的日期网格
const endMonthDays = computed(() => getMonthDays(endMonth.value, props.dayStartOfWeek))
// 生成年份列表
const yearList = computed(() => {
  const currentYear = dayjs().year()
  const years: number[] = []
  // 显示前后10年
  for (let i = currentYear - 10; i <= currentYear + 10; i++) years.push(i)
  return years
})
// 月份列表
const monthList = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: `${i + 1}月`,
}))

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
  // 只有当开始和结束日期都存在时才更新
  if (selectedStartDate.value && selectedEndDate.value) {
    emit('update:modelValue', [
      selectedStartDate.value.toDate(),
      selectedEndDate.value.toDate(),
    ])
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
  if (date.month() !== currentDisplayMonth.month()) return

  // 选择开始日期
  if (!isSelectingEndDate.value) {
    selectedStartDate.value = date
    selectedEndDate.value = null
    endDateText.value = ''
    isSelectingEndDate.value = true
    startDateText.value = date.format(FORMAT)
  }
  // 选择结束日期
  else {
    if (date.isBefore(selectedStartDate.value!)) {
      // 如果选择的结束日期在开始日期之前，交换它们
      selectedEndDate.value = selectedStartDate.value
      selectedStartDate.value = date
      startDateText.value = date.format(FORMAT)
      endDateText.value = selectedEndDate.value!.format(FORMAT)
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
// 关闭弹框
function closePicker(): void {
  // 如果只选择了一个日期，清除选择状态
  if (isSelectingEndDate.value) {
    selectedStartDate.value = null
    startDateText.value = ''
    isSelectingEndDate.value = false
  }
  showPicker.value = false
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

// 上一月
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

</style>
