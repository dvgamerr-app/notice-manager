<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="py-3">
      <ol class="breadcrumb p-1 px-2">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa :icon="['fab','line']" /> <span class="ml-1" v-text="bot.text" />
          </span>
        </li>
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <span class="ml-1" v-text="service.name" />
          </span>
        </li>
      </ol>
      <div class="text-muted mb-1" style="font-size:1.1rem">
        การใช้งานระบบอย่างรายละเอียด
      </div>
      <div class="" style="font-size:1.1rem">
        ...
      </div>
    </b-col>
  </b-row>
</template>

<script>
import Bot from '../../../../model/bot'
import Botroom from '../../../../model/botRoom'

export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ params }) {
    return params
  },
  computed: {
    bot () {
      return Bot.query().where('value', this.name).first()
    },
    service () {
      return Botroom.query().where('name', this.room).first()
    },
    profile () {
      return this.$store.state.profile
    }
  },
  created () {
    if (!this.bot) { this.$router.back() }
  },
  // computed: {
  //   getServiceSample () {
  //     return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
  //   },
  //   getRoomSample () {
  //     const service = Notify.query().where('value', this.sample.service).get()[0] || {}
  //     return (service.room || []).map(e => ({ id: e.value, label: e.text }))
  //   }
  // },
  mounted () {
  }
}
</script>
<style lang="scss">
</style>
