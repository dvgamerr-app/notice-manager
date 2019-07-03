<template>
<b-row class="docs mt-5 mb-5">
  <b-col>
    <b-row>
      <b-col>
        <h5><fa icon="bell" /> <b>LINE Notify</b></h5>
        <pre class="language-html" data-type="put"><code class="text-white">/notify/:service/:room</code></pre>
        <h6>Parameter</h6> 
        <b-table bordered small :items="url1.param.items" :fields="url1.param.fields"></b-table>
        <h6>Body</h6>
        <b-table bordered small :items="url1.body.items" :fields="url1.body.fields"></b-table>
        <h6>Example code</h6>
        <p class="sample-code p-2 mt-1 border">
          <code>
          curl -X PUT {{api.server}}/notify/{{api.notify.service ? api.notify.service : '[service_name]'}}/{{api.notify.room ? api.notify.room : '[room_name]'}} -H "Content-Type: application/json" -d "{ \"message\": \"Testing\nMessage\" }"
          </code>
        </p>
        <h6>Send a Sample</h6>
        <div>
          Select Service: 
          <b-dropdown :text="`${ api.notify.service ? api.notify.service : '[service_name]'}`" variant="outline-info">
            <b-dropdown-item href="#" v-for="e in getServiceSample" :key="e._id" @click.prevent="onSampleChangeService(e)">
              <span v-text="e.name" />
            </b-dropdown-item>
          </b-dropdown>
          Select Room:
          <b-dropdown :text="`${ api.notify.room ? api.notify.room : '[room_name]'}`" variant="outline-info">
            <b-dropdown-item href="#" v-for="e in getRoomSample" :key="e._id" @click.prevent="onSampleChangeRoom(e)">
              <span v-text="e.name" />
            </b-dropdown-item>
          </b-dropdown>
          <b-link href="#" @click.prevent="onTestNotify()">Testing</b-link>
        </div>
      </b-col>
    </b-row>
    
    <b-row class="mt-3">
      <b-col>
        <h5><fa :icon="['fab','line']" /> <b>LINE BOT</b></h5>
      </b-col>
    </b-row>
    <b-row class="mt-3">
      <b-col>
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
      notify: {
        service: null,
        room: null
      },
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
    url1: {
      param: {
        fields: ['field', 'type', 'description'],
        items: [
          { field: 'service', type: 'String', description: 'Service name' },
          { field: 'room', type: 'String', description: 'Room name.' },
        ]
      },
      body: {
        fields: ['field', 'type', 'description'],
        items: [
          { field: 'message', type: 'String', description: 'Message to line notify.' }
        ]
      }
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
  computed: {
    getServiceSample () {
      return this.service
    },
    getRoomSample () {
      let service = this.service.filter(e => e.service === this.api.notify.service)
      return service && service[0] ? service[0].room : []
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
    async onTestNotify () {
      if (!this.api.notify.service || !this.api.notify.room) return
      let { data } = await this.$axios.put(`/notify/${this.api.notify.service}/${this.api.notify.room}`, {
        message: '*LINE-BOT*\nNotify testing message.'
      })
      if (data.error) return console.log(data.error)
      console.log(data)
    },
    onSampleChangeService (e) {
      this.api.notify.service = e.service
      this.api.notify.room = '[room_name]'
    },
    onSampleChangeRoom (e) {
      this.api.notify.room = e.room
    }
  }
}
</script>

<style lang="scss">
.docs {
  .sample-code {
    font-size: .85rem;
    code {
      font-size: .7rem;
    }
  }
}
</style>
