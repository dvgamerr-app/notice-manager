<template>
  <b-row>
    <b-col class="pt-5">
      <b-row class="mb-5">
        <b-col md="6">
          <div v-for="e in service" :key="e._id">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
              <h5 v-text="e.name" />
            </div>
            <ul class="line-notify">
              <li v-for="r in e.room" :key="r._id">
                <b-btn variant="icon" size="sm" @click.prevent="onRevokeToken(r)">
                  <fa :icon="!btn.trash ? 'trash-alt' : 'circle-notch'" :spin="btn.trash" />
                </b-btn>
                {{ r.room }} ({{ r.name }})
                <b-link href="#" @click.prevent="onTestNotify(e, r)">Test</b-link>
              </li>
            </ul>
          </div>
        </b-col>
        <b-col md="6">
          <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
            <h3>How to add room</h3>
          </div>
          <ol>
            <li>
              <b-dropdown v-if="!add.service" id="dropdown-dropright" dropright :text="`Select Service${ add.service ? ` : ${add.service}` : ''}`" variant="info" class="m-2">
                <b-dropdown-item href="#" v-for="e in service" :key="e._id" @click.prevent="onChangeService(e)">
                  <span v-text="e.name" />
                </b-dropdown-item>
              </b-dropdown>
              <div v-else>
                <b-row>
                  <b-col md="3">
                    <input type="text" class="form-control" maxlength="20" v-model="add.room">
                  </b-col>
                  <b-col md="9">
                    <b-link :href="`/register-bot/${add.service}/${add.room || ''}`">Join Room</b-link>
                  </b-col>
                </b-row>
              </div>
            </li>
            <li>Select room in your account.</li>
            <li>Add <b>LINE Notify</b> friend and invite to room your select.</li>
            <img src="~assets/img_th.png">
          </ol>
        </b-col>
      </b-row>
      <b-row class="mb-5">
        <b-col md="12">
          <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
            <h3>How to new Service Notify</h3>
          </div>
          <ol>
            <li>Create name</li>
            <input type="text" class="form-control" v-model="row.name">
            <li>Click <a href="https://notify-bot.line.me/my/services/new" target="_blank">Add Service</a> to create service.</li>
            <li>Input <b>Service URL</b> <code>{{ getOrigin() }}/</code></li>
            <li>Input <b>Callback URL</b> <code>{{ getOrigin() }}/register-bot</code></li>
            <li>Click <b>Argee and Contuiue</b> and click <b>Add</b>.</li>
            <li>Goto <a href="https://notify-bot.line.me/my/services/" target="_blank">My Services</a> and click your service.</li>
            <li>Check your email becouse client secret will be valid only after verifying your email address.</li>
            <li>Copy <b>client id</b> and input this.</li>
            <input type="text" class="form-control" maxlength="32" v-model="row.client_id">
            <li>Copy <b>client secret</b> and input this.</li>
            <input type="text" class="form-control" maxlength="64" v-model="row.client_secret">
          </ol>
          <b-btn :variant="btn.submit ? 'outline-secondary' : 'primary'" :disabled="btn.submit" @click="onSubmit">
            <fa v-if="btn.submit" icon="circle-notch" spin /> Create notify
          </b-btn>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script>

const dashboard = '/api/service/dashboard'

export default {
  data: () => ({
    btn: {
      submit: false,
      trash: false
    },
    row: {
      name: '',
      client_id: '',
      client_secret: ''
    },
    add: {
      service: ''
    },
    service: []
  }),
  async asyncData ({ $axios }) {
    let { data, status, statusText } = await $axios(dashboard)
    if (status !== 200) throw new Error(`Server Down '${dashboard}' is ${statusText}.`)
    return {
      service: data
    }
  },
  methods: {
    getOrigin () {
      return process.client ? window.location.origin : ''
    },
    async updateService () {
      let { data } = await this.$axios(dashboard)
      this.service = data
    },
    async onSubmit () {
      this.btn.submit = true
      try {
        if (!this.row.name || !this.row.client_id || !this.row.client_secret) throw new Error('fields in undefined.')
        let res = await this.$axios.post('/api/service', this.row)
        if (res.error) throw new Error(res.error)
        
        this.row.name = ''
        this.row.client_id = ''
        this.row.client_secret = ''
        await this.updateService()
      } catch (ex) {
        console.error(ex)
      }
      this.btn.submit = false
    },
    onChangeService (e) {
      this.add.service = e.service
    },
    async onTestNotify (e, r) {
      let { data } = await this.$axios.put(`/notify/${r.service}/${r.room}`, {
        message: '*LINE-BOT*\nNotify testing message.'
      })
      if (data.error) return console.log(data.error)
    },
    async onRevokeToken (r) {
      this.btn.trash = true
      let { data } = await this.$axios.put(`/revoke/${r.service}/${r.room}`, { revoke: 'agree' })
      if (data.error) return console.log(data.error)

      await this.updateService()
      this.btn.trash = false
    }
  }
}
</script>
<style lang="scss" scoped>
ul.line-notify {
  padding-left: 5px;
  li {
    display: block;
  }
  .btn-icon {
    font-size: 11px !important;
    padding: 0rem 0.2rem !important;
    margin-top: -2px !important;
    border-radius: 0px;
    color: #CCC;
  }
  .btn-icon:hover {
    color: inherit;
  }
}
</style>

