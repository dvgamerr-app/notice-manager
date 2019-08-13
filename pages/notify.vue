<template>
<b-container fluid>
  <b-tabs class="aside-bar" pills card vertical no-fade nav-wrapper-class="aside overflow-auto w-fix-280 flex-shrink-0 flex-grow-0 position-relative border-right">
    <b-tab title="New Service">
      <template slot="title">
        <fa icon="plus" /> New Service
      </template>
      <notify-new :api="api" />
    </b-tab>
    <b-tab title="Join Room">
      <template slot="title">
        <fa icon="plus" /> Join Room
      </template>
      <notify-join :api="api" />
    </b-tab>
    <b-tab title="Service Manager" active>
      <notify-list :api="api" :list="list" />
    </b-tab>
    <b-tab title="API Reference">
      <notify-api :api="api" :sample="sample">
        <b-card slot="sample" v-if="service && service.length > 0" title="Sample API">
          <b-form inline>
            <label class="mr-2" for="select-service">Service: </label>
            <b-dropdown id="select-service" class="mr-2" :text="`${ sample.service ? sample.service : '[service_name]'}`" variant="outline-info">
              <b-dropdown-item href="#" v-for="e in getServiceSample" :key="e._id" @click.prevent="onSampleChangeService(e)">
                <span v-text="e.name" />
              </b-dropdown-item>
            </b-dropdown>
            <label class="mr-2" for="select-room">Room: </label>
            <b-dropdown id="select-room" class="mr-4" :text="`${ sample.room ? sample.room : '[room_id]'}`" variant="outline-info">
              <b-dropdown-item href="#" v-for="e in getRoomSample" :key="e._id" @click.prevent="onSampleChangeRoom(e)">
                <span v-text="e.name" />
              </b-dropdown-item>
            </b-dropdown>
            <b-button variant="outline-warning" @click.prevent="onTestNotify()">Testing</b-button>
          </b-form>
          <h6>Response</h6>
          <p class="sample-code"><code v-html="sample.test || '[show after click testing api.]'" /></p>
        </b-card>
      </notify-api>
    </b-tab>
  </b-tabs>
</b-container>
</template>

<script>
import notifyNew from '../components/notify/new'
import notifyJoin from '../components/notify/join'
import notifyList from '../components/notify/list'
import notifyApi from '../components/notify/api'

import moment from 'moment'

export default {
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
    },
    list: []
  }),
  components: {
    notifyNew,
    notifyJoin,
    notifyList,
    notifyApi
  },
  async asyncData ({ req, redirect, env, $axios }) {
    if (process.server && req.headers['x-host'] && !/localhost\.com/ig.test(req.headers.host)) {
      redirect('https://intense-citadel-55702.herokuapp.com')
      return
    }

    const dashboard = '/api/service/dashboard'
    let { data, status, statusText } = await $axios(dashboard)
    if (status !== 200) throw new Error(`Server Down '${dashboard}' is ${statusText}.`)

    return {
      api: {
        hosts: env.HOST_API,
        server: env.PROXY_API || env.HOST_API
      },
      list: data.service
    }
  },
  methods: {
    getLimitPercent (value, max) {
      return Math.round(value * max / max)
    },
    getDayPercent (value, max) {
      let limit = this.getLimitPercent(value, max)
      let day = Math.round(moment().date() * max / moment().endOf('month').date())
      // value: 0 max: 1000 limit 0 day 3
      return limit >= day ? 0 : day - limit
    },
    showToast (msg) {
      this.$bvToast.toast(msg, {
        toaster: 'b-toaster-bottom-right',
        title: 'LINE-Notify',
        autoHideDelay: 3000,
        solid: true,
        variant: 'warning'
      })
    },
    checkName (name) {
      return !/[^0-9a-z.-]+/g.test(name)
    },
    async updateService () {
      // let { data } = await this.$axios(dashboard)
      // this.hosts = data.hosts
      // this.service = data.service
      // this.$forceUpdate()
    },
    async updateStats () {
      // let { data } = await this.$axios(dashboard)
      // this.bot = data.bot
      // this.webhook = data.webhook
      // this.$forceUpdate()
    },
    async onSubmitWebhook (e) {
      e
    },
    async onSubmitBot (e) {
      e
    },
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
      let { data } = await this.$axios.post('/api/service/check', { room: this.add.room, service: this.add.service })
      if (data.error) {
        this.check.room = false
        this.showToast(data.error)
        return e.preventDefault()
      }
      this.check.room = true
      this.$router.push(`/register-bot/${this.add.service}/${this.add.room || ''}`, () => this.$router.go(0))
    },
    async onRevokeToken (r) {
      this.btn.trash = null
      this.btn.remove = r._id
      let { data } = await this.$axios.put(`/revoke/${r.service}/${r.room}`, { revoke: 'agree' })
      if (data.error) return console.log(data.error)

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
    async onUpdateName (e) {
      this.edit.mode = e._id
      this.edit.service = e.name
    },
    async onSyncBot () {
      if (this.sync.bot) return
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

