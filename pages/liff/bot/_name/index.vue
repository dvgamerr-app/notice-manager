<template>
  <b-row v-if="!$store.state.wait && bot">
    <b-col sm="12" class="py-3">
      <ol class="breadcrumb p-1 px-2 mb-0">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa :icon="['fab','line']" /> <span class="ml-1" v-text="bot.text" />
          </span>
        </li>
      </ol>
      <b-progress :max="stats.limited" variant="danger" height=".2rem">
        <b-progress-bar :value="getLimitPercent(stats.usage, stats.limited)" />
        <b-progress-bar :value="getDayPercent(stats.usage, stats.limited)" :show-value="false" variant="default" />
      </b-progress>
      <div class="text-muted mb-3" style="font-size:0.85rem">
        used reply {{ stats.reply === 'unready' ? 0 : getUsage(stats.reply) }} messages
        and push {{ stats.push === 'unready' ? 0 : getUsage(stats.push) }} messages.
      </div>
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
import dayjs from 'dayjs'
import numeral from 'numeral'
import Bot from '../../../../model/bot'
import Botroom from '../../../../model/botRoom'

export default {
  layout: 'liff',
  transition: 'fade',
  async asyncData ({ params, $axios }) {
    const { data: stats } = await $axios(`/api/stats/bot/${params.name}`)
    return Object.assign(params, { stats })
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
    getUsage ({ wait, stats }) {
      return wait ? '...' : numeral(stats.limited - stats.usage).format('0,0')
    },
    getLimitPercent (value, max) {
      return Math.round(value * max / max)
    },
    getDayPercent (value, max) {
      const limit = this.getLimitPercent(value, max)
      const day = Math.round(dayjs().date() * max / dayjs().endOf('month').date())
      // value: 0 max: 1000 limit 0 day 3
      return limit >= day ? 0 : day - limit
    },
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
.breadcrumb {
  border-radius: 0.25rem 0.25rem 0 0;
}
.progress {
  background-color: #d8d8d8;
  .progress-bar {
    color: #404040 !important;
  }
  font-weight: bold;
  font-size: .65rem;
  .bg-default {
    background-color: #4caf50;
  }
}
</style>
