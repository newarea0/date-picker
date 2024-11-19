import type { DirectiveBinding } from 'vue'

export const clickOutside = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el._clickOutside = (event: Event) => {
      // 检查点击事件是否发生在元素内部或其子元素上
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside)
  },
}
