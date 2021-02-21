<template>
  <b-container fluid>
    <b-col sm="12" md="4">
      <h5 class="mt-3">
        <fa :icon="['fab','line']" /> <b>LINE BOT</b>
        <b-btn sm variant="icon" size="sm" @click="onSyncBot">
          <fa icon="sync-alt" :spin="sync.bot" />
        </b-btn>
      </h5>
      <div v-if="!getBotSample || getBotSample.length == 0" class="mb-2" style="color: #989898;font-size:.9rem;">
        No bot line.
      </div>
      <div v-for="e in getBotSample" :key="e._id">
        <b>{{ e.text }} <small>({{ getUsage(e) }})</small></b>
        <b-progress :max="e.stats.limited" variant="info" height=".8rem" class="mb-3" :animated="e.wait">
          <b-progress-bar :value="e.wait ? 0 : getLimitPercent(e.stats.usage, e.stats.limited)" :label-html="String(e.stats.usage)" />
          <b-progress-bar :value="e.wait ? e.stats.limited : getDayPercent(e.stats.usage, e.stats.limited)" :show-value="false" variant="default" />
        </b-progress>
      </div>
    </b-col>
  </b-container>
</template>

<script>
import numeral from 'numeral'
import moment from 'moment'

import Api from '../model/api'
import Notify from '../model/notify'
import Bot from '../model/bot'
import Webhook from '../model/webhook'

const dashboard = '/api/service/dashboard'

export default {
  async asyncData ({ env, $axios }) {
    if (!Api.query().first()) {
      await Api.insert({
        data: { id: 1, hostname: env.HOST_API, proxyname: env.PROXY_API || env.HOST_API }
      })

      const { data, status, statusText } = await $axios(dashboard)
      if (status !== 200) { throw new Error(`Server Down '${dashboard}' is ${statusText}.`) }

      for (const item of data.service) {
        await Notify.insert({ data: item })
      }
      for (const item of data.bot) {
        await Bot.insert({ data: item })
      }
      for (const item of data.webhook) {
        await Webhook.insert({ data: item })
      }
    }
    return { }
  },
  data: () => ({
    sync: {
      bot: false
    }
  }),
  computed: {
    getBotSample () {
      return Bot.query().get()
    }
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
      const day = Math.round(moment().date() * max / moment().endOf('month').date())
      // value: 0 max: 1000 limit 0 day 3
      return limit >= day ? 0 : day - limit
    },
    async onSyncBot () {
      if (this.sync.bot) { return }
      this.sync.bot = true
      for (const e of this.getBotSample) {
        await Bot.update({ where: e._id, data: { wait: true } })
        const { data } = await this.$axios(`/api/stats/bot/${e._id}`, { progress: false })
        await Bot.update({ where: e._id, data: { wait: true, status: data } })
      }
      this.sync.bot = false
    }
  }
}
</script>

<style lang="scss" scoped>
.btn-sync {
  padding: 2px 6px;
  margin-top: -7px;
  color: #e2e2e2;
}
.edit-name {
  border-color: transparent;
  outline: 0;
  box-shadow: none;
  font-size: .9rem;
  padding: 2px 6px;
  height: auto;
}
.qr-code {
  width: 150px;
  height: 150px;
}
.input-group-text {
  background-color: transparent;
  border: none;
  padding-left: 0px;
}
ul.line-notify {
  padding-left: 5px;
  font-size: 0.75rem;
  li {
    display: block;
  }
  .btn-icon {
    font-size: .68rem !important;
    padding: 0rem 0.2rem !important;
    margin-top: -2px !important;
    border-radius: 0px;
    color: #CCC;
  }
  .btn-icon:hover {
    color: inherit;
  }
}
.menu-notify {
  margin-top: -10px;
  button {
    &.edit {
      padding: 0rem 0.15rem;
      font-size: 0.8rem;
    }
    &.trash {
      padding: 0rem 0.3rem;
      font-size: 0.77rem;
    }
  }
}
.bg-default {
  background-color: #ccd0d4;
}
</style>
