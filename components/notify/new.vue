<template>
  <b-form>
    <b-row class="mb-2">
      <b-col lg="6">
        <h4>How to create new service?</h4>
        <ol>
          <li>Click <a href="https://notify-bot.line.me/my/services/new" target="_blank">Add Service</a> to create service.</li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Create name</b-input-group-text>
              <b-form-input size="sm" maxlength="40" :state="check.service" v-model.trim="data.name" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
          <li>Input <b>Service URL</b> <code>{{ api.hosts }}/</code></li>
          <li>Input <b>Callback URL</b> <code>{{ api.hosts }}/register-bot</code></li>
          <li>Click <b>Argee and Contuiue</b> and click <b>Add</b>.</li>
          <li>Goto <a href="https://notify-bot.line.me/my/services/" target="_blank">My Services</a> and click your service.</li>
          <li>Check your email becouse client secret will be valid only after verifying your email address.</li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Copy Client ID</b-input-group-text>
              <b-form-input size="sm" maxlength="32" :state="check.client_id" v-model.trim="data.client_id" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Copy Client Secret</b-input-group-text>
              <b-form-input size="sm" maxlength="64" :state="check.client_secret" v-model.trim="data.client_secret" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
        </ol>
        <b-btn :variant="btn.submit ? 'outline-secondary' : 'primary'" :disabled="btn.submit" @click="onSubmitNotify($event)">
          <fa v-if="btn.submit" icon="circle-notch" spin /> Create notify
        </b-btn>
      </b-col>
      <b-col lg="6">
        <h4>How to add LINE-Notify to room?</h4>
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
              <b-input-group-text>Room name</b-input-group-text>
              <b-form-input size="sm" ref="room" maxlength="20" :state="check.room" v-model.trim="add.room" @keyup.enter="onJoinRoom($event)" />
            </b-input-group>
          </li>
          <li>Your line account choose room and click <b>agree and connect</b>.</li>
          <li>Invite <b>LINE Notify</b> to room your select.</li>
        </ol>
        <b-card-text>After your remember step and click <b>join room</b>.</b-card-text>
        <b-link @click="onJoinRoom($event)">
          <fa icon="external-link-alt" /> Join room
        </b-link>
      </b-col>
    </b-row>
  </b-form>
</template>
<script>

export default {
  props: [ 'api' ],
  data: () => ({
    list: [],
    check: {
      room: null,
      service: null,
      client_id: null,
      client_secret: null
    },
    btn: {
      submit: false
    },
    data: {
      name: '',
      client_id: '',
      client_secret: '',
      url: '',
      type: '',
      webhook: ''
    },
    add: {
      service: '',
      room: ''
    }
  }),
  // computed: {
  //   getBotnameSample () {
  //     return this.bot
  //   },
  //   getServiceSample () {
  //     return this.list
  //   },
  //   getRoomSample () {
  //     let service = this.list.filter(e => e.service === this.api.notify.service)
  //     return service && service[0] ? service[0].room : []
  //   }
  // },
  methods: {
    onChangeService (e) {
      let vm = this
      vm.add.service = e.service
      vm.$nextTick(() => {
        vm.$refs.room.focus()
      })
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
    async onSubmitNotify (e) {
      if (!this.data.name || !this.checkName(this.data.name)) {
        this.check.service = false
        this.check.client_id = null
        this.check.client_secret = null
        this.showToast('Name is empty or not a-z,0-9, and - .')
        return e.preventDefault()
      }

      if (!this.data.client_id) {
        this.check.client_id = false
        this.check.service = null
        this.check.client_secret = null
        this.showToast('client_id is empty.')
        return e.preventDefault()
      }

      if (!this.data.client_secret) {
        this.check.client_secret = false
        this.check.client_id = null
        this.check.service = null
        this.showToast('client_secret is empty.')
        return e.preventDefault()
      }

      this.btn.submit = true
      try {
        let res = await this.$axios.post('/api/service', this.data)
        if (res.error) throw new Error(res.error)
        
        this.data.name = ''
        this.data.client_id = ''
        this.data.client_secret = ''
        this.check.service = null
        this.check.client_id = null
        this.check.client_secret = null
        // await this.updateService()
      } catch (ex) {
        console.error(ex)
      }
      this.btn.submit = false
    },
  }
}
</script>
