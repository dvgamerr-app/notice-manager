<template>
  <b-form>
    <b-row class="mb-2">
      <b-col>
        <h4>README</h4>
        <p>
          ให้สร้าง service ก่อนเพื่อเชื่อมต่อ token กับ line notify แล้วค่อยเอา service ที่สร้างไป join เข้าห้องที่ต้องให้ใช้งาน notify.
        </p>
        <h3>วิธีเพิ่ม service ใหม่</h3>
        <ol>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Name</b-input-group-text>
              <b-form-input v-model.trim="data.name" size="sm" maxlength="40" :state="check.service" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
          <li class="pt-1 pb-1">
            Click <a href="https://notify-bot.line.me/my/services/new" target="_blank">Add Service</a> to create service.
          </li>
          <li class="pt-1 pb-1">
            Input <b>Service URL</b> <code>{{ api.hostname }}/</code>
          </li>
          <li class="pt-1 pb-1">
            Input <b>Callback URL</b> <code>{{ api.hostname }}/register</code>
          </li>
          <li class="pt-1 pb-1">
            Click <b>Argee and Contuiue</b> and click <b>Add</b>.
          </li>
          <li class="pt-1 pb-1">
            Goto <a href="https://notify-bot.line.me/my/services/" target="_blank">My Services</a> and click your service.
          </li>
          <li class="pt-1 pb-1">
            <span class="badge badge-warning">IMPORTANT</span> <b>Check your mailbox becouse client secret will be valid after verify in email.</b>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Client ID</b-input-group-text>
              <b-form-input v-model.trim="data.client_id" size="sm" maxlength="32" :state="check.client_id" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Client Secret</b-input-group-text>
              <b-form-input v-model.trim="data.client_secret" size="sm" maxlength="64" :state="check.client_secret" @keyup.enter="onSubmitNotify($event)" />
            </b-input-group>
          </li>
        </ol>
        <b-btn :variant="btn.submit ? 'outline-secondary' : 'primary'" :disabled="btn.submit" @click="onSubmitNotify($event)">
          <fa v-if="btn.submit" icon="circle-notch" spin /> Create notify
        </b-btn>
        <b-modal
          id="'trash-'" v-model="btn.approve"
          title="New service?" no-fade
          ok-title="Sure, Add now." cancel-title="No."
          ok-variant="success" cancel-variant="default" @ok="onSubmitNotify($event)"
        >
          Your want to add new service '{{ data.name }}' ?
        </b-modal>
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
      submit: false,
      approve: false
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
  computed: {
    api () {
      return Api.query().first()
    }
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
  },
  methods: {
    onChangeService (e) {
      const vm = this
      vm.add.service = e.service
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

      if (!this.btn.approve) {
        this.btn.approve = true
        return e.preventDefault()
      }

      this.btn.submit = true
      try {
        const { data: res } = await this.$axios.post('/api/service', this.data)
        if (res.error) { throw new Error(res.error) }
        // await this.updateService()
        await Notify.insert({
          data: {
            _id: res._id,
            text: this.data.name,
            value: this.data.name,
            room: []
          }
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
      } finally {
        this.btn.approve = false
        this.btn.submit = false
      }
    }
  }
}
</script>
