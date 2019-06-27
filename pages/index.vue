<template>
  <b-row>
    <b-col class="pt-5">
      <h3>Dashboard</h3>
      <hr>
      <b-row class="mb-5">
        <b-col md="12">
          <div v-for="e in service" :key="e._id">
            <h5 v-text="e.name" />
            <ul>
              <li v-for="r in e.room" :key="r._id">
                {{ r.room }}
              </li>
            </ul>
          </div>
        </b-col>
      </b-row>
      <h3>How to new Service Notify</h3>
      <hr>
      <b-row class="mb-5">
        <b-col md="12">
          <ol>
            <li>Create name</li>
            <input type="text" class="form-control" v-model="row.name">
            <li>Create display name</li>
            <input type="text" class="form-control" v-model="row.display">
            <li>Click <a href="https://notify-bot.line.me/my/services/new" target="_blank">Add Service</a> to create service.</li>
            <li>Input <b>Service URL</b> <code>https://intense-citadel-55702.herokuapp.com/</code></li>
            <li>Input <b>Callback URL</b> <code>https://intense-citadel-55702.herokuapp.com/register-bot</code></li>
            <li>Click <b>Argee and Contuiue</b> and click <b>Add</b>.</li>
            <li>Goto <a href="https://notify-bot.line.me/my/services/" target="_blank">My Services</a> and click your service.</li>
            <li>Check your email becouse client secret will be valid only after verifying your email address.</li>
            <li>Copy <b>client id</b> and input this.</li>
            <input type="text" class="form-control" v-model="row.client_id">
            <li>Copy <b>client secret</b> and input this.</li>
            <input type="text" class="form-control" v-model="row.client_secret">
          </ol>
          <button class="btn btn-primary" @click="onSubmit">Create notify</button>
        </b-col>
      </b-row>
    </b-col>
  </b-row>
</template>

<script>

const dashboard = '/api/service/dashboard'

export default {
  data: () => ({
    row: {
      name: '',
      display: '',
      client_id: '',
      client_secret: ''
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
    async onSubmit () {
      try {
        if (!this.row.name || !this.row.display || !this.row.client_id || !this.row.client_secret) throw new Error('fields in undefined.')
        let res = await this.$axios.post('/api/service', this.row)
        if (res.error) throw new Error(res.error)
        let { data } = await this.$axios(dashboard)
        this.service = data
      } catch (ex) {
        console.error(ex)
      }
    }
  }
}
</script>
