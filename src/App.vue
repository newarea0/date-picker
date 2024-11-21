<script setup lang="ts">
import DateRangePicker from '@/components/date-range-picker.vue'
import { DateRangePicker as DateRangePickerPlugin } from '@/plugin/date-range-picker'
import dayjs from 'dayjs'

// Vue 3
const dateRange = ref([null, null])

// 原生 JS
const dateRangePicker = ref<DateRangePickerPlugin | null>(null)
onMounted(() => {
  dateRangePicker.value = new DateRangePickerPlugin({
    element: document.getElementById('date-range-picker')!,
    dayStartOfWeek: 1, // 周一作为一周的开始
    onChange: (dates) => {
      console.log('Selected dates:', dates)
    },
  })
})
onUnmounted(() => {
  dateRangePicker.value = null
})
</script>

<template>
  <div class="app">
    <div>
      <h3>Vue 3</h3>
      <DateRangePicker v-model="dateRange" :day-start-of-week="1" />
      <p>
        <span>结果：</span>
        <span v-if="dateRange[0]">
          {{ dayjs(dateRange[0]).format('YYYY-MM-DD') }}
          至
          {{ dayjs(dateRange[1]).format('YYYY-MM-DD') }}
        </span>
        <span v-else>请选择日期范围</span>
      </p>
    </div>

    <div>
      <h3>原生 JS</h3>
      <div id="date-range-picker" />
    </div>
  </div>
</template>

<style scoped>
.app {
  padding: 20px;
  display: flex;
  gap: 20px;
}

.app > div {
  flex: 1;
}
</style>
