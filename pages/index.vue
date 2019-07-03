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
                        <li style="padding:5px 0">
                          <b-dropdown dropright :text="`Select Service${ add.service ? ` : ${add.service}` : ''}`" variant="outline-info">
                            <b-dropdown-item href="#" v-for="e in service" :key="e._id" @click.prevent="onChangeService(e)">
                              <span v-text="e.name" />
                            </b-dropdown-item>
                          </b-dropdown>
                        </li>
                        <li style="padding:5px 0">
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
          <div v-for="(e, i) in service" :key="e._id">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center border-bottom mb-1">
              <b-form-input v-if="edit.mode === e._id" class="edit-name col-10" maxlength="20" v-model.trim="edit.service" @keyup.enter="onSaveName(e, i)" />
              <h6 v-if="edit.mode !== e._id" v-text="e.name" />
              <div class="menu-notify">
                <b-btn v-if="edit.mode !== e._id" class="edit" variant="icon" size="sm" @click="onUpdateName(e)"><fa icon="edit" /></b-btn>
                <b-btn v-if="edit.mode !== e._id" class="trash" v-b-modal="'trash-' + e._id" variant="icon" size="sm"><fa icon="trash-alt" /></b-btn>
                <b-modal :id="'trash-' + e._id" title="Delete service?" no-fade ok-title="Sure, Delete it." cancel-title="No, Thank."
                  ok-variant="danger" cancel-variant="default">
                  Your want to delete service '{{ e.name }}' ?
                </b-modal>
              </div>
            </div>
            <ul class="line-notify">
              <li v-if="!e.room || e.room.length == 0" style="color: #989898;">No room join.</li>
              <li v-for="r in e.room" :key="r._id">
                <b-btn v-if="btn.trash !== r._id" variant="icon" size="sm" @click.prevent="() => btn.trash = r._id">
                  <fa :icon="btn.trash !== 'wait' ? 'trash-alt' : 'circle-notch'" :spin="btn.trash === r._id" />
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
          <h5><fa :icon="['fab','line']" /> <b>LINE BOT</b></h5>
          <h5><fa :icon="['fab','slack-hash']" /> <b>Slack</b></h5>
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
      service: '',
      mode: null
    },
    add: {
      service: '',
      room: ''
    },
    service: []
  }),
  async asyncData ({ $axios }) {
    let { data, status, statusText } = await $axios(dashboard)
    if (status !== 200) throw new Error(`Server Down '${dashboard}' is ${statusText}.`)
    return {
      service: data.groups,
      hosts: data.hosts
    }
  },
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
      this.service = data.groups
      this.hosts = data.hosts
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
      this.btn.trash = 'wait'
      let { data } = await this.$axios.put(`/revoke/${r.service}/${r.room}`, { revoke: 'agree' })
      if (data.error) return console.log(data.error)

      await this.updateService()
      this.btn.trash = null
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
    }
  }
}
</script>
<style lang="scss" scoped>
.dashboard {
  .card {
    border: none;
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

