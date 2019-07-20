<template>
<b-row class="docs mt-5 mb-5">
  <b-col>
    <b-row>
      <b-col>
        <h4><fa icon="bell" /> <b>LINE Notify</b></h4>
        <h5 class="mt-1">Push Message API</h5>
        <pre class="language-html" data-type="put"><code class="text-white">/notify/:service/:room</code></pre>
        <h6>Parameter</h6> 
        <b-table bordered small :items="url1.param.items" :fields="url1.param.fields"></b-table>
        <h6>Body</h6>
        <b-table bordered small :items="url1.body.items" :fields="url1.body.fields"></b-table>
        <h6>Example code</h6>
        <p class="sample-code p-2 mt-1 border">
          <code>
          curl -X PUT {{api.server}}/notify/{{api.notify.service ? api.notify.service : '[service_name]'}}/{{api.notify.room ? api.notify.room : '[room_id]'}} -H "Content-Type: application/json" -d "{ \"message\": \"Testing\nMessage\" }"
          </code>
        </p>
        <b-card v-if="service && service.length > 0" title="Sample API">
          <b-form inline>
            <label class="mr-2" for="select-service">Service: </label>
            <b-dropdown id="select-service" class="mr-2" :text="`${ api.notify.service ? api.notify.service : '[service_name]'}`" variant="outline-info">
              <b-dropdown-item href="#" v-for="e in getServiceSample" :key="e._id" @click.prevent="onSampleChangeService(e)">
                <span v-text="e.name" />
              </b-dropdown-item>
            </b-dropdown>
            <label class="mr-2" for="select-room">Room: </label>
            <b-dropdown id="select-room" class="mr-4" :text="`${ api.notify.room ? api.notify.room : '[room_id]'}`" variant="outline-info">
              <b-dropdown-item href="#" v-for="e in getRoomSample" :key="e._id" @click.prevent="onSampleChangeRoom(e)">
                <span v-text="e.name" />
              </b-dropdown-item>
            </b-dropdown>
            <b-button variant="outline-warning" @click.prevent="onTestNotify()">Testing</b-button>
          </b-form>
          <h6>Response</h6>
          <p class="sample-code"><code v-html="api.notify.test || '[show after click testing api.]'" /></p>
        </b-card>
      </b-col>
    </b-row>
    
    <b-row class="mt-5">
      <b-col>
        <h4><fa :icon="['fab','line']" /> <b>LINE BOT</b></h4>
        <h5 class="mt-1">Push Message API</h5>
        <pre class="language-html" data-type="put"><code class="text-white">/:botname/:id</code></pre>
        <h6>Parameter</h6> 
        <b-table bordered small :items="url2.param.items" :fields="url2.param.fields"></b-table>
        <h6>Body</h6>
        <b-table bordered small :items="url2.body.items" :fields="url2.body.fields"></b-table>
        <p>
          Messages sent with the Messaging API can be divided into two categories: <b>reply messages</b> and <b>push messages</b>.<br>
          for more detailed information about messages, see Message objects in the <a href="https://developers.line.biz/en/docs/messaging-api/message-types/">Messaging API</a> reference.
        </p>
        <h6>Example code</h6>
        <p class="sample-code p-2 mt-1 border">
          <code>
          curl -X PUT {{api.server}}/{{api.bot.name ? api.bot.name : '[name]'}}/{{api.bot.to ? api.bot.to : '[id]'}} -H "Content-Type: application/json" -d "{ \"type\":\"text\",\"text\":\"Testing\nMessage\" }"
          </code>
        </p>
        <b-card v-if="bot && bot.length > 0" title="Sample API">
          <b-form inline>
            <label class="mr-2" for="select-botname">Bot Name: </label>
            <b-dropdown id="select-botname" class="mr-2" :text="`${ api.bot.name ? api.bot.name : '[name]'}`" variant="outline-info">
              <b-dropdown-item href="#" v-for="e in getBotnameSample" :key="e._id" @click.prevent="onSampleChangeBotname(e)">
                <span v-text="e.name" />
              </b-dropdown-item>
            </b-dropdown>
            <label class="mr-2" for="select-botname">userId : </label>
            <b-input class="mr-4 col-4" v-model="api.bot.to" />
            <b-button variant="outline-warning" @click.prevent="onTestBot()">Testing</b-button>
          </b-form>
          <h6>Response</h6>
          <p class="sample-code"><code v-html="api.bot.test || '[show after click testing api.]'" /></p>
        </b-card>
        <h5 class="mt-3">Push Flex Message API</h5>
        <pre class="language-html" data-type="put"><code class="text-white">/flex/:name/:id</code></pre>
        <h6>Parameter</h6> 
        <b-table bordered small :items="url3.param.items" :fields="url3.param.fields"></b-table>
        <h6>Body</h6>
        <b-table bordered small :items="url3.body.items" :fields="url3.body.fields"></b-table>
        <h6>Example code</h6>
        <p class="sample-code p-2 mt-1 border">
          <code>
          curl -X PUT {{api.server}}/flex/{{api.flex.name ? api.flex.name : '[name]'}}/{{api.flex.to ? api.flex.to : '[id]'}} -H "Content-Type: application/json" -d "{ \"type\":\"text\",\"text\":\"Testing\nMessage\" }"
          </code>
        </p>
        <b-card v-if="bot && bot.length > 0" title="Sample API">
          <b-form inline>
            <label class="mr-2">Botname:</label>
            <b class="mr-3">health-check</b>
            <label class="mr-2" for="select-botname">Flex: </label>
            <b-dropdown class="mr-2" :text="`${ api.flex.name ? api.flex.name : '[name]'}`" variant="outline-info" :state="false">
              <b-dropdown-item href="#" v-for="(e, i) in ['alert','error']" :key="i" @click.prevent="onSampleChangeFlex(e)">
                <span v-text="e" />
              </b-dropdown-item>
            </b-dropdown>
            <label class="mr-2" for="select-botname">userId : </label>
            <b-input class="mr-4 col-4" v-model="api.flex.to" />
            <b-button variant="outline-warning" @click.prevent="onTestFlex()">Testing</b-button>
          </b-form>
          <h6>Response</h6>
          <p class="sample-code"><code v-html="api.flex.test || '[show after click testing api.]'" /></p>
        </b-card>
      </b-col>
    </b-row>
    <b-row class="mt-5">
      <b-col>
        <h4><fa icon="link" /> <b>Webhook</b></h4>
        <h5 class="mt-1">Push Message API</h5>
      </b-col>
    </b-row>
  </b-col>
</b-row>
</template>



<script>
const dashboard = '/api/service/dashboard'

export default {
  data: () => ({
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
        fields: [
          { key: "field", label: "Field", tdClass: 'table-col-field'},
          { key: "type", label: "Type" , tdClass: 'table-col-field'},
          { key: "description", label: "Description" , tdClass: 'table-col-desc'}
        ],
        items: [
          { field: 'service', type: 'String', description: 'Service name' },
          { field: 'room', type: 'String', description: 'Room name.' },
        ]
      },
      body: {
        fields: [
          { key: "field", label: "Field", tdClass: 'table-col-field'},
          { key: "type", label: "Type" , tdClass: 'table-col-field'},
          { key: "description", label: "Description" , tdClass: 'table-col-desc'}
        ],
        items: [
          { field: 'message', type: 'String', description: 'Message to line notify.' }
        ]
      }
    },
    url2: {
      param: {
        fields: [
          { key: "field", label: "Field", tdClass: 'table-col-field'},
          { key: "type", label: "Type" , tdClass: 'table-col-field'},
          { key: "description", label: "Description" , tdClass: 'table-col-desc'}
        ],
        items: [
          { field: 'botname', type: 'String', description: 'Botname your register in site.' },
          { field: 'id', type: 'String', description: 'userId, groupId, roomId or replyId' },
        ]
      },
      body: {
        fields: [
          { key: "field", label: "Field", tdClass: 'table-col-field'},
          { key: "type", label: "Type" , tdClass: 'table-col-field'},
          { key: "description", label: "Description" , tdClass: 'table-col-desc'}
        ],
        items: [
          { field: 'type', type: 'String', description: 'text' },
          { field: 'text', type: 'String', description: 'Message text. You can include the following emoji and max 2000 characters' }
        ]
      }
    },
    url3: {
      param: {
        fields: [
          { key: "field", label: "Field", tdClass: 'table-col-field'},
          { key: "type", label: "Type" , tdClass: 'table-col-field'},
          { key: "description", label: "Description" , tdClass: 'table-col-desc'}
        ],
        items: [
          { field: 'name', type: 'String', description: 'flex name alert or error only.' },
          { field: 'id', type: 'String', description: 'userId, groupId, roomId or replyId' },
        ]
      },
      body: {
        fields: [
          { key: "field", label: "Field", tdClass: 'table-col-field'},
          { key: "type", label: "Type" , tdClass: 'table-col-field'},
          { key: "description", label: "Description" , tdClass: 'table-col-desc'}
        ],
        items: [
          { field: 'app', type: 'String', description: 'title' },
          { field: 'message', type: 'String', description: 'Message text.' },
          { field: 'detail', type: 'String', description: 'show only error text.' }
        ]
      }
    },
    service: [],
    bot: [],
    slack: []
  }),
  async asyncData ({ env, $axios }) {
    let { data, status, statusText } = await $axios(dashboard)
    if (status !== 200) throw new Error(`Server Down '${dashboard}' is ${statusText}.`)
    return {
      api: {
        hosts: env.HOST_API,
        server: env.PROXY_API || env.HOST_API,
        notify: {
          test: '',
          service: null,
          room: null
        },
        bot: {
          test: '',
          name: null,
          to: null
        },
        flex: {
          test: '',
          name: null,
          to: null
        }
      },
      service: data.service || [],
      bot: data.bot || [],
      webhook: data.webhook || []
    }
  },
  head: () => ({
    title: 'Documentation'
  }),
  computed: {
    getBotnameSample () {
      return this.bot
    },
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
      this.api.notify.test = JSON.stringify(data)
      if (data.error) return console.log(data.error)
    },
    async onTestBot () {
      if (!this.api.bot.name || !this.api.bot.to) return
      let { data } = await this.$axios.put(`/${this.api.bot.name}/${this.api.bot.to}`, {
        type: 'text',
        text: '*LINE-BOT*\tTesting message.'
      })
      this.api.bot.test = JSON.stringify(data)
      if (data.error) return console.log(data.error)
    },
    async onTestFlex () {
      if (!this.api.flex.name || !this.api.flex.to) return
      let { data } = await this.$axios.put(`/flex/${this.api.flex.name}/${this.api.flex.to}`, {
        app: 'LINE-BOT',
        message: 'Testing',
        detail: 'message'
      })
      this.api.flex.test = JSON.stringify(data)
      if (data.error) return console.log(data.error)
    },
    onSampleChangeFlex (e) {
      this.api.flex.name = e
    },
    onSampleChangeBotname (e) {
      this.api.bot.name = e.botname
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
  .table-col-field {
    width: 15%;
  }
  .table-col-desc {
    width: 70%;
  }
  .sample-code {
    font-size: .85rem;
    code {
      font-size: .7rem;
    }
  }
}
</style>
