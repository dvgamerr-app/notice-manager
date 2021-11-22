
<template>
  <div class="slider" :class="{ 'border-bottom': !comfirm }">
    <div class="panal" :class="{ removed: comfirm }">
      <!-- @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd" -->
      <div ref="item" class="item" :style="{transform: `translateX(${posX}px)`,'border-radius': posX !== 0 ? '4px' : '0px'}">
        <slot />
      </div>
      <div ref="remove" class="remove flex-shrink-1" :style="{ opacity: comfirm ? 0 : 1 }">
        <slot name="delete">
          <div class="remove-content py-2">
            <fa icon="trash-alt" class="fa-xs" />
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
<script>
import { debounce } from 'debounce'
/* eslint-disable no-console */
export default {
  name: 'ItemDrop',
  props: {
    index: {
      type: Number,
      default: () => -1
    },
    disabled: {
      type: Boolean,
      default: () => false
    }
  },
  data () {
    return {
      comfirm: false,
      startX: 0, // Touch location
      disX: 0, // Moving distance
      posX: 0
    }
  },
  methods: {
    touchStart (ev) {
      if (ev.touches.length < 1 || this.comfirm || this.disabled) { return }
      const [touch] = ev.touches
      this.startX = touch.clientX
    },
    touchMove (ev) {
      if (ev.touches.length < 1 || this.comfirm || this.disabled) { return }
      const [touch] = ev.touches
      const { offsetWidth: removeWidth } = this.$refs.remove

      const vm = this
      return debounce(() => {
        vm.disX = vm.startX - touch.clientX
        if (Math.round(this.disX) < removeWidth) { return }

        if (vm.disX < 0 || vm.disX === 0) {
          vm.posX = 0
        } else if (vm.disX > 0) {
          vm.posX = Math.round(vm.disX * -1)
        }
      }, 100)()
    },
    touchEnd (ev) {
      if (ev.changedTouches.length < 1 || this.comfirm || this.disabled) { return }
      const [changed] = ev.changedTouches
      const { offsetWidth } = this.$refs.item

      const vm = this
      return debounce(() => {
        vm.disX = vm.startX - changed.clientX
        const emitEvent = Math.round(vm.disX * 100 / offsetWidth) < 65
        if (emitEvent) {
          vm.posX = 0
        } else {
          vm.posX = offsetWidth * -1
          setTimeout(() => {
            vm.comfirm = true
            vm.$emit('delete')
          }, 250)
        }
      }, 100)()
    }
  }
}
</script>

<style lang="scss">
@import '~assets/scss/mixin';
.panal {
  @include flex(flex-start, row, center);
}

.slider {
  @include flex(flex-start, row, center);
  &:last-child {
    border-color: #F7F8FB !important;
  }

  .panal {
    background-color: var(--danger);
    transition: all 0.3s ease-in-out;
    width: 100%;
    max-height: 500px;
    &.removed {
      max-height: 0;
      border-width: 0px !important;
    }
    .item {
      background-color: #F7F8FB;
      transition: all 0.1s ease-in-out;
      width: calc(100% + 65px);
      z-index: 1;
    }
    .remove {
      transition: all 0.3s ease-in-out;
      position: absolute;
      right: 15px;
      &-content {
        width: 45px;
        text-align: center;
        color: #F7F8FB;
      }
    }
  }
}
</style>
