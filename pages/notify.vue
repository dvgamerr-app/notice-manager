<template>
  <b-container fluid>
    <b-row class="d-block d-md-none">
      <b-col sm="12" class="mt-4">
        <notify-api :sample="sample">
          <b-card v-if="list && list.length > 0" slot="sample" title="Sample API">
            <b-form>
              <label class="mr-2" for="select-service">Service: </label>
              <treeselect v-model="sample.service" :options="getServiceSample" placeholder="Select service" />
              <label class="mr-2" for="select-room">Room: </label>
              <treeselect v-model="sample.room" :options="getRoomSample" placeholder="Select room" />
              <b-button class="mt-3" block variant="outline-warning" @click.prevent="onTestNotify">
                Testing
              </b-button>
            </b-form>
            <h6 class="mt-3">
              Response
            </h6>
            <p class="sample-code">
              <code>{{ sample.test || '[show after click testing api.]' }}</code>
            </p>
          </b-card>
        </notify-api>
      </b-col>
    </b-row>
    <b-tabs
      class="aside-bar d-none d-md-flex"
      pills
      card
      vertical
      no-fade
      nav-wrapper-class="aside overflow-auto w-fix-280 flex-shrink-0 flex-grow-0 position-relative border-right"
    >
      <b-tab title="Service Manager" active>
        <b-row>
          <b-col lg="8">
            <notify-new />
            <notify-join />
          </b-col>
          <b-col lg="4">
            <notify-list @update-service="updateService" />
          </b-col>
        </b-row>
      </b-tab>
      <b-tab title="API Reference">
        <notify-api :sample="sample">
          <b-card v-if="list && list.length > 0" slot="sample" title="Sample API">
            <b-form>
              <label class="mr-2" for="select-service">Service: </label>
              <treeselect v-model="sample.service" :options="getServiceSample" placeholder="Select service" />
              <label class="mr-2" for="select-room">Room: </label>
              <treeselect v-model="sample.room" :options="getRoomSample" placeholder="Select room" />
              <b-button variant="outline-warning" @click.prevent="onTestNotify">
                Testing
              </b-button>
            </b-form>
            <h6>Response</h6>
            <p class="sample-code">
              <code>{{ sample.test || '[show after click testing api.]' }}</code>
            </p>
          </b-card>
        </notify-api>
      </b-tab>
    </b-tabs>
  </b-container>
</template>

<script>
import moment from 'moment'
import Treeselect from '@riophae/vue-treeselect'
import notifyNew from '../components/notify/new'
import notifyJoin from '../components/notify/join'
import notifyList from '../components/notify/list'
import notifyApi from '../components/notify/api'

import Api from '../model/api'
import Notify from '../model/notify'
import Bot from '../model/bot'
import Webhook from '../model/webhook'

const dashboard = '/api/service/dashboard'

export default {
  components: {
    Treeselect,
    notifyNew,
    notifyJoin,
    notifyList,
    notifyApi
  },
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
    sample: {
      test: '',
      service: null,
      room: null
    },
    sync: {
      bot: false,
      webhook: false
    },
    btn: {
      trash: null,
      remove: null
    },
    edit: {
      show: null,
      service: '',
      mode: null
    }
  }),
  computed: {
    list () {
      return Notify.query().orderBy('text').get()
    },
    getServiceSample () {
      return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
    },
    getRoomSample () {
      const service = Notify.query().where('value', this.sample.service).get()[0] || {}
      return (service.room || []).map(e => ({ id: e.value, label: e.text }))
    }
  },
  methods: {
    getLimitPercent (value, max) {
      return Math.round(value * max / max)
    },
    getDayPercent (value, max) {
      const limit = this.getLimitPercent(value, max)
      const day = Math.round(moment().date() * max / moment().endOf('month').date())
      // value: 0 max: 1000 limit 0 day 3
      return limit >= day ? 0 : day - limit
    },
    showToast (msg) {
      this.$bvToast.toast(msg, {
        toaster: 'b-toaster-bottom-right',
        title: 'LINE-Notice',
        autoHideDelay: 3000,
        solid: true,
        variant: 'warning'
      })
    },
    async onTestNotify () {
      if (!this.sample.service || !this.sample.room) { return }
      const { data } = await this.$axios.put(`/notify/${this.sample.service}/${this.sample.room}`, {
        message: '*LINE-BOT*\nNotify testing message.'
      })
      this.sample.test = JSON.stringify(data)
      if (data.error) { this.showToast(data.error) }
    },
    checkName (name) {
      return !/[^0-9a-z.-]+/g.test(name)
    },
    async updateService () {
      const { data } = await this.$axios(dashboard)
      this.hosts = data.hosts
      this.service = data.service
      this.$forceUpdate()
    },
    async updateStats () {
      const { data } = await this.$axios(dashboard)
      this.bot = data.bot
      this.webhook = data.webhook
      this.$forceUpdate()
    },
    // async onSubmitWebhook (e) {
    // },
    // async onSubmitBot (e) {
    // },
    async onJoinRoom (e) {
      if (!this.add.service) {
        this.showToast('Select service name in dropdown.')
        return e.preventDefault()
      }
      if (!this.add.room) {
        this.check.room = false
        this.showToast('Input room name.')
        return e.preventDefault()
      }
      if (!this.checkName(this.add.room)) {
        this.check.room = false
        this.showToast('Name verify a-z,0-9, and - .')
        return e.preventDefault()
      }
      const { data } = await this.$axios.post('/api/service/check', { room: this.add.room, service: this.add.service })
      if (data.error) {
        this.check.room = false
        this.showToast(data.error)
        return e.preventDefault()
      }
      this.check.room = true
      this.$router.push(`/register/${this.add.service}/${this.add.room || ''}`, () => this.$router.go(0))
    },
    async onRevokeToken (r) {
      this.btn.trash = null
      this.btn.remove = r._id
      const { data } = await this.$axios.put(`/revoke/${r.service}/${r.room}`, { revoke: 'agree' })
      if (data.error) { this.showToast(data.error) }

      await this.updateService()
      this.btn.remove = null
    },
    async onSaveName (e, i) {
      await this.$axios.post('/api/service/update', { name: this.edit.service, _id: e._id })
      this.service[i].name = this.edit.service
      this.edit.mode = null
      this.edit.service = ''
    },
    async onSaveActive () {
      await this.$axios.post('/api/service/update', { active: false })
    },
    onUpdateName (e) {
      this.edit.mode = e._id
      this.edit.service = e.name
    },
    async onSyncBot () {
      if (this.sync.bot) { return }
      this.sync.bot = true
      await this.$axios('/api/stats/bot')
      await this.updateStats()
      this.sync.bot = false
    }
  }
}
</script>
<style lang="scss" scoped>
.dashboard {
  .webhook-channel {
    .topic {
      color: #7b7b7b;
      font-size: .7rem;
    }
  }
  .btn-sync {
    padding: 2px 6px;
    margin-top: -7px;
    color: #e2e2e2;
  }
  .progress {
    .progress-bar {
      color: #404040 !important;
    }
    font-weight: bold;
    font-size: .65rem;
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
  .bg-default {
    background-color: #ccd0d4;
  }
}
</style>
