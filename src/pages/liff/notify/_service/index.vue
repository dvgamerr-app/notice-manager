<template>
  <b-row v-if="!$store.state.wait && item">
    <b-col :cols="$route.query.view ? 12 : 9" class="pt-3">
      <ol class="breadcrumb p-1 px-2 mb-0">
        <li class="breadcrumb-item active">
          <span class="d-flex align-items-center">
            <fa icon="bell" /> <span class="ml-1" v-text="item.text" />
          </span>
        </li>
      </ol>
      <div class="text-muted" style="font-size: 0.85rem">
        This month, using push {{ getUsage(stats.push) }} posts.
      </div>
    </b-col>
    <b-col v-if="!$route.query.view" cols="3" class="pl-0 pt-3 mb-1">
      <b-button
        :to="`/liff/${item.type}/${item.value}/new`"
        variant="info"
        block
        class="btn-new"
      >
        <fa icon="plus" /> <span>Join</span>
      </b-button>
    </b-col>
    <b-col cols="12" class="py-3">
      <lazy-liff-item-drop v-for="e in room" :key="e.$id" @delete="remove(e)">
        <nuxt-link
          :to="`/liff/${item.type}/${item.value}/${e.value}`"
          class="d-flex align-items-center list-item py-3 border-bottom"
        >
          <div class="flex-grow-1 px-2">
            <div class="display" v-text="e.name" />
            <div class="name text-muted">
              <small>{{ $hostApi }}/{{ service }}/{{ e.value }}</small>
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
// import Api from '../../../../model/api'
// import Notify from '../../../../model/notify'
// import Notiroom from '../../../../model/notiRoom'

export default {
  layout: 'liff',
  transition: 'fade',
  async asyncData ({ $api, $router, store, env, params }) {
    const { status, data: room } = await $api.request(
      `GET /notify/${params.service}/room`,
      {
        headers: { 'x-user-liff': store.state.profile.userId }
      }
    )
    if (status !== 200) {
      await $router.replace('/liff/notify')
    }

    return Object.assign(params, { env }, { room })
  },
  data () {
    return {
      item: {},
      stats: {},
      room: []
    }
  },
  computed: {
    profile () {
      return this.$store.state.profile
    }
  },
  mounted () {
    if (this.env.devEnv) {
      this.$store.commit('profile', this.$tempProfile)
    }
  },
  created () {
    const [data] = this.$store.state.lineNotify.filter(
      e => e.value === this.service
    )
    this.item = data
  },
  methods: {
    getUsage (stats) {
      return numeral(stats).format('0,0')
    },
    getLimitPercent (value, max) {
      return Math.round((value * max) / max)
    },
    getDayPercent (value, max) {
      const limit = this.getLimitPercent(value, max)
      const day = Math.round(
        (dayjs().date() * max) / dayjs().endOf('month').date()
      )
      // value: 0 max: 1000 limit 0 day 3
      return limit >= day ? 0 : day - limit
    }
    // remove (e) {
    //   Notiroom.update({
    //     $$id: e.$$id,
    //     data: { removed: true }
    //   })
    //   // this.bot.room.splice(index, 1)
    //   // await Bot.update((file) => {
    //   //   console.log(file)
    //   //   return false
    //   // })
    // }
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
  font-size: 0.65rem;
  .bg-default {
    background-color: #4caf50;
  }
}
</style>
