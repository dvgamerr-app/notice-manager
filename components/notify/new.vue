<template>
  <b-form>
    <b-row class="mb-2">
      <b-col>
        <h4>How to create new service?</h4>
        <ol>
          <li>Click <a href="https://notify-bot.line.me/my/services/new" target="_blank">Add Service</a> to create service.</li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Create name</b-input-group-text>
              <b-form-input v-model.trim="data.name" size="sm" maxlength="40" :state="check.service" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
          <li>Input <b>Service URL</b> <code>{{ api().hostname }}/</code></li>
          <li>Input <b>Callback URL</b> <code>{{ api().hostname }}/register-bot</code></li>
          <li>Click <b>Argee and Contuiue</b> and click <b>Add</b>.</li>
          <li>Goto <a href="https://notify-bot.line.me/my/services/" target="_blank">My Services</a> and click your service.</li>
          <li>Check your email becouse client secret will be valid only after verifying your email address.</li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Copy Client ID</b-input-group-text>
              <b-form-input v-model.trim="data.client_id" size="sm" maxlength="32" :state="check.client_id" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Copy Client Secret</b-input-group-text>
              <b-form-input v-model.trim="data.client_secret" size="sm" maxlength="64" :state="check.client_secret" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
        </ol>
        <b-btn :variant="btn.submit ? 'outline-secondary' : 'primary'" :disabled="btn.submit" @click="onSubmitNotify($event)">
          <fa v-if="btn.submit" icon="circle-notch" spin /> Create notify
        </b-btn>
      </b-col>
    </b-row>
  </b-form>
</template>
<script>
import Api from '../../model/api'
import Notify from '../../model/notify'

export default {
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
    api () {
      return Api.query().first()
    },
    onChangeService (e) {
      const vm = this
      vm.add.service = e.service
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
        const res = await this.$axios.post('/api/service', this.data)
        if (res.error) { throw new Error(res.error) }
        // await this.updateService()
        await Notify.insert({
          _id: null,
          name: this.data.name,
          service: this.data.name,
          room: []
        })

        this.data.name = ''
        this.data.client_id = ''
        this.data.client_secret = ''
        this.check.service = null
        this.check.client_id = null
        this.check.client_secret = null
        this.showToast('Successful.')
      } catch (ex) {
        this.showToast(ex.stack || ex.message)
      }
      this.btn.submit = false
    }
  }
}
</script>
