
<template>
  <div class="slider">
    <div class="panal border-bottom" :class="{ removed: comfirm }" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd">
      <div ref="item" class="item" :style="itemStyle">
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
  computed: {
    itemStyle () {
      return {
        transform: `translateX(${this.posX}px)`,
        'border-radius': this.posX !== 0 ? '4px' : '0px'
      }
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

      this.disX = this.startX - touch.clientX
      if (this.disX < 0 || this.disX === 0) {
        this.posX = 0
      } else if (this.disX > 0) {
        this.posX = Math.round(this.disX * -1)
      }
    },
    touchEnd (ev) {
      if (ev.changedTouches.length < 1 || this.comfirm || this.disabled) { return }
      const [changed] = ev.changedTouches
      const { offsetWidth } = this.$refs.item

      this.disX = this.startX - changed.clientX
      const emitEvent = Math.round(this.disX * 100 / offsetWidth) < 65
      if (emitEvent) {
        this.posX = 0
      } else {
        this.posX = offsetWidth * -1
        setTimeout(() => {
          this.comfirm = true
          this.$emit('delete')
        }, 250)
      }
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
      background-color: #F7F7F7;
      transition: all 0.2s ease-in-out;
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
        color: #F7F7F7;
      }
    }
  }

}
</style>
