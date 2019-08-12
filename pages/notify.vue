<template>
<b-container fluid>
  <b-tabs class="aside-bar" pills card vertical no-fade nav-wrapper-class="aside overflow-auto w-fix-280 flex-shrink-0 flex-grow-0 position-relative border-right">
    <b-tab title="Create Service">
      <template slot="title">
        <fa icon="plus" /> New Service
      </template>
      <notify-new :api="api" />
    </b-tab>
    <b-tab title="Service Manager" active>
      <div>bbb</div>
    </b-tab>
    <b-tab title="API Reference">
      <div>ccc</div>
    </b-tab>
  </b-tabs>
</b-container>
</template>

<script>
import notifyNew from '../components/notify/new'

import moment from 'moment'
const dashboard = '/api/service/dashboard'

export default {
  data: () => ({
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
    bot: [],
    webhook: []
  }),
  components: {
    notifyNew
  },
  async asyncData ({ req, redirect, env, $axios }) {
    if (process.server && req.headers['x-host'] && !/localhost\.com/ig.test(req.headers.host)) {
      redirect('https://intense-citadel-55702.herokuapp.com')
      return
    }

    let { data, status, statusText } = await $axios(dashboard)
    if (status !== 200) throw new Error(`Server Down '${dashboard}' is ${statusText}.`)
    return {
      api: {
        hosts: env.HOST_API,
        server: env.PROXY_API || env.HOST_API,
        bot: {
          name: null,
          to: null
        }
      },
      service: data.service,
      bot: data.bot,
      webhook: data.webhook
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
      let { data } = await this.$axios(dashboard)
      this.hosts = data.hosts
      this.service = data.service
      this.$forceUpdate()
    },
    async updateStats () {
      let { data } = await this.$axios(dashboard)
      this.bot = data.bot
      this.webhook = data.webhook
      this.$forceUpdate()
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
}

</style>

