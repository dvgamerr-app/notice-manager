<template>
  <b-row v-if="!$store.state.wait && bot">
    <b-col :cols="$route.query.view ? 12 : 9" class="pt-3">
      <ol class="breadcrumb p-1 px-2 mb-0">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa icon="bell" /> <span class="ml-1" v-text="bot.text" />
          </span>
        </li>
      </ol>
      <div class="text-muted" style="font-size:0.85rem">
        This month, using push {{ getUsage(stats.push) }} posts.
      </div>
    </b-col>
    <b-col v-if="!$route.query.view" cols="3" class="pl-0 pt-3 mb-1">
      <b-button :to="`/liff/${bot.type}/${bot.value}/new`" variant="info" block class="btn-new">
        <fa icon="plus" /> <span>Join</span>
      </b-button>
    </b-col>
    <b-col cols="12" class="py-3">
      <lazy-liff-item-drop v-for="e in room" :key="e.$id" @delete="remove(e)">
        <nuxt-link :to="`/liff/${bot.type}/${bot.value}/${e.value}`" class="d-flex align-items-center list-item py-3 border-bottom">
          <div class="flex-grow-1 px-2">
            <div class="display" v-text="e.name" />
          </div>
        </nuxt-link>
      </lazy-liff-item-drop>
    </b-col>
  </b-row>
</template>

<script>
import dayjs from 'dayjs'
import numeral from 'numeral'
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
    bot () {
      return Notify.query().where('value', this.service).first()
    },
    room () {
      return Notiroom.query().where('removed', false).where('service', this.service).get()
    },
    profile () {
      return this.$store.state.profile
    }
  },
  created () {
    if (!this.bot) { this.$router.back() }
  },
  methods: {
    getUsage (stats) {
      return numeral(stats).format('0,0')
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
      Notiroom.update({
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
