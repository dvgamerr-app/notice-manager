<template>
  <b-row v-if="!$store.state.wait && bot">
    <b-col sm="12" class="py-3">
      <h3 class="pb-1 mb-3 border-bottom" v-text="bot.text" />
      <lazy-liff-item-drop v-for="e in room" :key="e.$id" @delete="remove(e)">
        <span>
          {{ e.name }}
        </span>
      </lazy-liff-item-drop>
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../model/api'
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
      return Bot.query().where('value', this.botname).first()
    },
    room () {
      return Botroom.query().where('removed', false).where('botname', this.botname).get()
    },
    profile () {
      return this.$store.state.profile
    }
  },
  created () {
    if (!this.bot) { this.$router.back() }
  },
  methods: {
    remove (e) {
      Botroom.update({
        $$id: e.$$id,
        data: { removed: true }
      })
      // this.bot.room.splice(index, 1)
      // await Bot.update((file) => {
      //   console.log(file)
      //   return false
      // })
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
<style lang="scss">
</style>
