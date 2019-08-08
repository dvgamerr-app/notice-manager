<template>
  <b-tabs class="aside-bar" pills card vertical no-fade nav-wrapper-class="aside overflow-auto border-right">
    <b-tab title="Create Service">
      <template slot="title">
        <fa icon="plus" /> New Service
      </template>
      <b-form>
        <b-row class="mb-2">
          <b-col>
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
            </b-card>
          </b-col>
        </b-row>
      </b-form>
    </b-tab>
    <b-tab title="Service Manager" active>
      <div v-if="!service || service.length == 0" class="mb-2" style="color: #989898;font-size:.9rem;">
        No service notify.
      </div>
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
    </b-tab>
    <b-tab title="API Reference">
      <docs :api="api" :sample="sample">
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
      </docs>
    </b-tab>
  </b-tabs>
</template>
<script>
import docs from '../components/docs/api'
const dashboard = '/api/service/dashboard'

export default {
  props: [ 'api', 'service' ],
  data: () => ({
    list: [],
    sample: {
      test: '',
      service: null,
      room: null
    },
    check: {
      room: null,
      service: null,
      client_id: null,
      client_secret: null
    },
    btn: {
      submit: false
    },
    edit: {
      show: null,
      service: '',
      mode: null
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
  components: {
    docs
  },
  computed: {
    getBotnameSample () {
      return this.bot
    },
    getServiceSample () {
      return this.list
    },
    getRoomSample () {
      let service = this.list.filter(e => e.service === this.api.notify.service)
      return service && service[0] ? service[0].room : []
    }
  },
  methods: {
    onChangeService (e) {
      let vm = this
      vm.add.service = e.service
      vm.$nextTick(() => {
        vm.$refs.room.focus()
      })
    },
    async updateService () {
      let { data } = await this.$axios(dashboard)
      this.hosts = data.hosts
      this.service = data.service
      this.$forceUpdate()
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
        let res = await this.$axios.post('/api/service', this.row)
        if (res.error) throw new Error(res.error)
        
        this.data.name = ''
        this.data.client_id = ''
        this.data.client_secret = ''
        this.check.service = null
        this.check.client_id = null
        this.check.client_secret = null
        await this.updateService()
      } catch (ex) {
        console.error(ex)
      }
      this.btn.submit = false
    },
  }
}
</script>
