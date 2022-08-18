<template>
  <b-row>
    <b-col sm="12" class="py-3">
      <ol class="breadcrumb align-items-center p-1 px-2">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa icon="bell" /> <span class="ml-1" v-text="service" />
          </span>
        </li>
        <li class="breadcrumb-item d-flex align-items-center active">
          <span class="d-flex align-items-center">
            <span class="ml-1" v-text="room" />
          </span>
        </li>
      </ol>
      <div class="text-muted mb-1 mt-3" style="font-size: 1.1rem">
        วิธีใช้งานและการทดสอบ
      </div>
      <liff-example
        :url="`${env.baseUrl}/notify/${service}/${room}`"
        :service="service"
        :room="room"
      />
      <div class="text-muted mb-1 mt-3" style="font-size: 1.1rem">
        การใช้งานระบบอย่างรายละเอียด
      </div>
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../../../../model/api'
// import Notify from '../../../../model/notify'
// import Notiroom from '../../../../model/notiRoom'

export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ env, params, $axios, $store }) {
    // const { data: stats } = await $axios(`/api/notify/${params.service}/room`, null, {
    //   headers: { 'x-user-liff': $store.state.profile.userId }
    // })
    return Object.assign(params, { env })
  },
  data () {
    return {
      type: 'view'
    }
  },
  computed: {
    profile () {
      return this.$store.state.profile
    }
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
<style lang="scss"></style>
