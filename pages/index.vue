<template>
  <b-row class="dashboard mt-5 mb-5">
    <b-col>
      <b-row>
        <b-col md="8">
          <b-tabs content-class="mt-3" fill no-fade>
            <b-tab active>
              <template slot="title">
                <fa icon="bell" /> <b>LINE Notify</b>
              </template>
              <b-form>
                <b-row class="mb-2">
                  <b-col>
                    <b-card title="1. How to new Service Notify?">
                      <ol>
                        <li>Create name</li>
                        <b-form-input :state="check.service" v-model.trim="row.name" @keyup.enter="onSubmit($event)" />
                        <li>Click <a href="https://notify-bot.line.me/my/services/new" target="_blank">Add Service</a> to create service.</li>
                        <li>Input <b>Service URL</b> <code>{{ hosts }}</code></li>
                        <li>Input <b>Callback URL</b> <code>{{ hosts }}register-bot</code></li>
                        <li>Click <b>Argee and Contuiue</b> and click <b>Add</b>.</li>
                        <li>Goto <a href="https://notify-bot.line.me/my/services/" target="_blank">My Services</a> and click your service.</li>
                        <li>Check your email becouse client secret will be valid only after verifying your email address.</li>
                        <li>Copy <b>client id</b> and input this.</li>
                        <b-form-input maxlength="32" :state="check.client_id" v-model.trim="row.client_id" @keyup.enter="onSubmit($event)" />
                        <li>Copy <b>client secret</b> and input this.</li>
                        <b-form-input maxlength="64" :state="check.client_secret" v-model.trim="row.client_secret" @keyup.enter="onSubmit($event)" />
                      </ol>
                      <b-btn :variant="btn.submit ? 'outline-secondary' : 'primary'" :disabled="btn.submit" @click="onSubmit($event)">
                        <fa v-if="btn.submit" icon="circle-notch" spin /> Create notify
                      </b-btn>
                    </b-card>
                  </b-col>
                </b-row>
                <b-row class="mb-2">
                  <b-col>
                    <b-card title="2. How to add LINE-Notify to room?">
                      <ol>
                        <li>Add <b>LINE Notify</b> friend.</li>
                        <b-img class="qr-code" src="~assets/notify-qr.png" />
                        <li class="pt-1 pb-1">
                          <b-dropdown dropright :text="`Select Service${ add.service ? ` : ${add.service}` : ''}`" variant="outline-info">
                            <b-dropdown-item href="#" v-for="e in service" :key="e._id" @click.prevent="onChangeService(e)">
                              <span v-text="e.name" />
                            </b-dropdown-item>
                          </b-dropdown>
                        </li>
                        <li class="pt-1 pb-1">
                          <b-input-group>
                            <b-input-group-text>Room name is</b-input-group-text>
                            <b-form-input ref="room" maxlength="20" :state="check.room" v-model.trim="add.room" @keyup.enter="onJoinRoom($event)" />
                          </b-input-group>
                        </li>
                        <li>Your line account choose room and click <b>agree and connect</b>.</li>
                        <li>Invite <b>LINE Notify</b> to room your select.</li>
                      </ol>
                      <b-card-text>After your remember step and click <b>join room</b>.</b-card-text>
                      <b-link @click="onJoinRoom($event)">
                        <fa icon="external-link-alt" /> Join room
                      </b-link>
                    </b-card>
                  </b-col>
                </b-row>
              </b-form>
            </b-tab>
            <b-tab>
              <template slot="title">
                <fa :icon="['fab','line']" /> <b>LINE BOT</b>
              </template>
              <b-row class="mb-2">
                <b-col>
                  <h5>README</h5>
                  <p class="sample-code p-2 mt-1 border">
                    <code>
                    curl -X PUT {{api.server}}/{{api.bot.name}}/{{api.bot.to}} -H "Content-Type: application/json" -d "{ \"message\": \"Testing\nMessage\" }"
                    </code>
                  </p>
                </b-col>
              </b-row>
            </b-tab>
            <b-tab>
              <template slot="title">
                <fa :icon="['fab','slack-hash']" /> <b>Slack</b>
              </template>
              <p>I'm the second tab</p>
            </b-tab>
          </b-tabs>
        </b-col>
        <b-col md="4">
          <h5><fa icon="bell" /> <b>LINE Notify</b></h5>
          <div v-for="(e, i) in service" :key="e._id" @mouseover="() => edit.show = e._id" @mouseleave="() => edit.show = null">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center border-bottom mb-1">
              <b-form-input v-if="edit.mode === e._id" class="edit-name col-10" maxlength="20" v-model.trim="edit.service" @keyup.enter="onSaveName(e, i)" />
              <h6 v-if="edit.mode !== e._id" v-text="e.name" />
              <div v-if="edit.show === e._id" class="menu-notify">
                <b-btn v-if="edit.mode !== e._id" class="edit" variant="icon" size="sm" @click="onUpdateName(e)"><fa icon="edit" /></b-btn>
                <b-btn v-if="edit.mode !== e._id" class="trash" v-b-modal="'trash-' + e._id" variant="icon" size="sm"><fa icon="trash-alt" /></b-btn>
              </div>
              <b-modal :id="'trash-' + e._id" title="Delete service?" no-fade ok-title="Sure, Delete it." cancel-title="No, Thank."
                ok-variant="danger" cancel-variant="default">
                Your want to delete service '{{ e.name }}' ?
              </b-modal>
            </div>
            <ul class="line-notify">
              <li v-if="!e.room || e.room.length == 0" style="color: #989898;">No room join.</li>
              <li v-for="r in e.room" :key="r._id">
                <b-btn v-if="btn.trash !== r._id" variant="icon" size="sm" @click.prevent="() => btn.trash = r._id">
                  <fa :icon="btn.remove !== r._id ? 'trash-alt' : 'circle-notch'" :spin="btn.remove === r._id" />
                </b-btn>
                <div v-else style="display: inline;">
                  <b-btn variant="icon" size="sm" @click.prevent="() => btn.trash = null">
                    <fa icon="times" />
                  </b-btn>
                  <b-btn variant="icon" class="text-danger" size="sm" @click.prevent="onRevokeToken(r)">
                    <fa icon="trash-alt" />
                  </b-btn>
                </div>
                {{ r.room }} ({{ r.name }})
              </li>
            </ul>
          </div>
          <h5>
            <fa :icon="['fab','line']" /> <b>LINE BOT</b>
            <b-btn variant="icon" size="sync" @click="onSyncBot"><fa icon="sync-alt" :spin="sync.bot" /></b-btn>
          </h5>
          <div v-for="e in bot" :key="e._id">
            <h6>{{ e.name }} <small>({{e.stats.limited}})</small></h6>
            <b-progress :max="e.stats.limited" show-progress variant="info" height=".9rem" class="mb-3">
              <b-progress-bar :value="e.stats.usage" :label-html="String(e.stats.usage)"></b-progress-bar>
            </b-progress>
          </div>
          <h5>
            <fa :icon="['fab','slack-hash']" /> <b>Slack</b>
            <b-btn variant="icon" size="sync" @click="onSyncSlack"><fa icon="sync-alt" :spin="sync.slack" /></b-btn>
          </h5>
          <div v-for="e in slack" :key="e._id" class="mb-1 slack-channel">
            <h6 class="mb-0">{{ e.name }} <small>({{ e.members }})</small></h6>
            <div v-if="e.topic.value" class="topic">{{ e.topic.value}} </div>
          </div>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script>

const dashboard = '/api/service/dashboard'

export default {
  data: () => ({
    api: {
      server: 'http://s-thcw-posweb01.pos.cmg.co.th:3000',
      bot: {
        name: '[botname]',
        to: '[userTo_replyTo]'
      }
    },
    sync: {
      bot: false,
      slack: false
    },
    check: {
      room: null,
      service: null,
      client_id: null,
      client_secret: null
    },
    btn: {
      submit: false,
      trash: null,
      remove: null
    },
    row: {
      name: '',
      client_id: '',
      client_secret: ''
    },
    edit: {
      show: null,
      service: '',
      mode: null
    },
    add: {
      service: '',
      room: ''
    },
    service: [],
    bot: [],
    slack: []
  }),
  async asyncData ({ $axios }) {
    let { data, status, statusText } = await $axios(dashboard)
    if (status !== 200) throw new Error(`Server Down '${dashboard}' is ${statusText}.`)
    return {
      service: data.service,
      bot: data.bot,
      slack: data.slack,
      hosts: data.hosts
    }
  },
  head: () => ({
    title: 'Dashboard - LINE Notify'
  }),
  methods: {
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
      this.slack = data.slack
      this.$forceUpdate()
    },
    async onSubmit (e) {
      if (!this.row.name || !this.checkName(this.row.name)) {
        this.check.service = false
        this.showToast('Name is empty or not a-z,0-9, and - .')
        return e.preventDefault()
      }

      if (!this.row.client_id) {
        this.check.client_id = false
        this.showToast('client_id is empty.')
        return e.preventDefault()
      }

      if (!this.row.client_secret) {
        this.check.client_secret = false
        this.showToast('client_secret is empty.')
        return e.preventDefault()
      }

      this.btn.submit = true
      try {
        let res = await this.$axios.post('/api/service', this.row)
        if (res.error) throw new Error(res.error)
        
        this.row.name = ''
        this.row.client_id = ''
        this.row.client_secret = ''
        this.check.service = null
        this.check.client_id = null
        this.check.client_secret = null
        await this.updateService()
      } catch (ex) {
        console.error(ex)
      }
      this.btn.submit = false
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
    onChangeService (e) {
      let vm = this
      vm.add.service = e.service
      vm.$nextTick(() => {
        vm.$refs.room.focus()
      })
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
    },
    async onSyncSlack () {
      if (this.sync.slack) return
      this.sync.slack = true
      await this.$axios('/api/stats/slack')
      await this.updateStats()
      this.sync.slack = false
    }
  }
}
</script>
<style lang="scss" scoped>
.dashboard {
  .card {
    border: none;
  }
  .slack-channel {
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
}

</style>

