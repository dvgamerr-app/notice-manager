<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="py-3">
      <ol class="breadcrumb p-1 px-2">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa icon="bell" /> <span class="ml-1" v-text="bot.text" />
          </span>
        </li>
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <span class="ml-1" v-text="join.name" />
          </span>
        </li>
      </ol>
      <div class="text-muted mb-1 mt-3" style="font-size:1.1rem">
        วิธีใช้งานและการทดสอบ
      </div>
      <liff-example :url="`${api.hostname}/${service}/${room}`" :service="service" :room="room" />
      <div class="text-muted mb-1 mt-3" style="font-size:1.1rem">
        การใช้งานระบบอย่างรายละเอียด
      </div>
    </b-col>
  </b-row>
</template>

<script>
import Api from '../../../../model/api'
import Notify from '../../../../model/notify'
import Notiroom from '../../../../model/notiRoom'

export default {
  layout: 'liff',
  transition: 'fade',
  async asyncData ({ params, $axios }) {
    const { data: stats } = await $axios(`/api/stats/notify/${params.service}`)
    return Object.assign(params, { stats })
  },
  data () {
    return {
      type: 'view'
    }
  },
  computed: {
    api () {
      return Api.query().first()
    },
    bot () {
      return Notify.query().where('value', this.service).first()
    },
    join () {
      return Notiroom.query().where('removed', false).where('service', this.service).first()
    },
    profile () {
      return this.$store.state.profile
    }
  },
  created () {
    if (!this.bot) { this.$router.back() }
  }
  // computed: {
  //   getServiceSample () {
  //     return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
  //   },
  //   getRoomSample () {
  //     const service = Notify.query().where('value', this.sample.service).get()[0] || {}
  //     return (service.room || []).map(e => ({ id: e.value, label: e.text }))
  //   }
  // },
}
</script>
<style lang="scss">
</style>
