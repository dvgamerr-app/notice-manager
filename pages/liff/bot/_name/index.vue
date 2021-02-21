<template>
  <b-row v-if="!$store.state.wait && bot">
    <b-col sm="12" class="py-3">
      <ol class="breadcrumb p-1 px-2">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa :icon="['fab','line']" /> <span class="ml-1" v-text="bot.text" />
          </span>
        </li>
      </ol>
      <lazy-liff-item-drop v-for="e in room" :key="e.$id" @delete="remove(e)">
        <nuxt-link :to="`/liff/${bot.type}/${bot.value}/${e.name}`" class="d-flex align-items-center list-item py-3 border-bottom">
          <div class="flex-grow-1 px-2">
            <div class="display" v-text="e.name" />
            <div class="name text-muted">
              <small>{{ e.stats }}</small>
            </div>
          </div>
        </nuxt-link>
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
  data () {
    return {
      type: 'view'
    }
  },
  computed: {
    bot () {
      return Bot.query().where('value', this.name).first()
    },
    room () {
      return Botroom.query().where('removed', false).where('botname', this.name).get()
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
