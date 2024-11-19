<script setup lang="ts">
import { ref } from 'vue'
import DateRangePicker from './components/date-range-picker.vue'

const dateRange = ref([null, null])

function handleDateChange(range: [Date | null, Date | null]) {
  // eslint-disable-next-line no-console
  console.log('Date range changed:', range)
}
</script>

<template>
  <div class="app">
    <DateRangePicker
      v-model="dateRange"
      :start-day="1"
      @change="handleDateChange"
    />
  </div>
</template>

<style scoped>
.app {
  padding: 20px;
}
</style>
