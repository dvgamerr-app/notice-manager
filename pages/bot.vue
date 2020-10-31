<template>
  <b-container fluid>
    <b-tabs class="aside-bar" pills card vertical no-fade nav-wrapper-class="aside overflow-auto w-fix-280 flex-shrink-0 flex-grow-0 position-relative border-right">
      <b-tab title="API Reference">
        <b-row>
          <b-col>
            <b-row class="mt-5">
              <b-col>
                <h4><fa :icon="['fab','line']" /> <b>LINE BOT</b></h4>
                <h5 class="mt-1">
                  Push Message API
                </h5>
                <pre class="language-html" data-type="put"><code class="text-white">/:botname/:id</code></pre>
                <h6>Parameter</h6>
                <b-table bordered small :items="url2.param.items" :fields="url2.param.fields" />
                <h6>Body</h6>
                <b-table bordered small :items="url2.body.items" :fields="url2.body.fields" />
                <p>
                  Messages sent with the Messaging API can be divided into two categories: <b>reply messages</b> and <b>push messages</b>.<br>
                  for more detailed information about messages, see Message objects in the <a href="https://developers.line.biz/en/docs/messaging-api/message-types/">Messaging API</a> reference.
                </p>
                <h6>Example code</h6>
                <p class="sample-code p-2 mt-1 border">
                  <code>
                    curl -X PUT {{ api.hostname }}/{{ bot.name ? bot.name : '[name]' }}/{{ bot.to ? bot.to : '[id]' }} -H "Content-Type: application/json" -d "{ \"type\":\"text\",\"text\":\"Testing\nMessage\" }"
                  </code>
                </p>
                <b-card v-if="getBotnameSample && getBotnameSample.length > 0" title="Sample API">
                  <b-form>
                    <label class="mr-2" for="select-botname">Bot Name: </label>
                    <treeselect v-model="bot.name" :options="getBotnameSample" placeholder="Select Bot" />
                    <label class="mr-2" for="select-botname">userId : </label>
                    <treeselect v-model="bot.to" :options="getRoomSample" placeholder="Select User" />
                    <b-button variant="outline-warning" @click.prevent="onTestBot()">
                      Testing
                    </b-button>
                  </b-form>
                  <h6>Response</h6>
                  <p class="sample-code">
                    <code>{{ bot.test || '[show after click testing api.]' }}</code>
                  </p>
                </b-card>
                <h5 class="mt-3">
                  Push Flex Message API
                </h5>
                <pre class="language-html" data-type="put"><code class="text-white">/flex/:name/:id</code></pre>
                <h6>Parameter</h6>
                <b-table bordered small :items="url3.param.items" :fields="url3.param.fields" />
                <h6>Body</h6>
                <b-table bordered small :items="url3.body.items" :fields="url3.body.fields" />
                <h6>Example code</h6>
                <p class="sample-code p-2 mt-1 border">
                  <code>
                    curl -X PUT {{ api.hostname }}/flex/{{ flex.name ? flex.name : '[name]' }}/{{ flex.to ? flex.to : '[id]' }} -H "Content-Type: application/json" -d "{ \"type\":\"text\",\"text\":\"Testing\nMessage\" }"
                  </code>
                </p>
                <b-card v-if="getBotnameSample && getBotnameSample.length > 0" title="Sample API">
                  <b-form inline>
                    <label class="mr-2">Botname:</label>
                    <b class="mr-3">health-check</b>
                    <label class="mr-2" for="select-botname">Flex: </label>
                    <b-dropdown class="mr-2" :text="`${ flex.name ? flex.name : '[name]'}`" variant="outline-info" :state="false">
                      <b-dropdown-item v-for="(e, i) in ['alert','error']" :key="i" href="#" @click.prevent="onSampleChangeFlex(e)">
                        <span v-text="e" />
                      </b-dropdown-item>
                    </b-dropdown>
                    <label class="mr-2" for="select-botname">userId : </label>
                    <b-input v-model="flex.to" class="mr-4 col-4" />
                    <b-button variant="outline-warning" @click.prevent="onTestFlex()">
                      Testing
                    </b-button>
                  </b-form>
                  <h6>Response</h6>
                  <p class="sample-code">
                    <code>{{ flex.test || '[show after click testing api.]' }}</code>
                  </p>
                </b-card>
              </b-col>
            </b-row>
          </b-col>
          <b-col class="d-none">
            <h5>
              <fa :icon="['fab','line']" /> <b>LINE BOT</b>
              <b-btn variant="icon" size="sync" @click="onSyncBot">
                <fa icon="sync-alt" :spin="sync.bot" />
              </b-btn>
            </h5>
            <div v-if="!getBotnameSample || getBotnameSample.length == 0" class="mb-2" style="color: #989898;font-size:.9rem;">
              No bot line.
            </div>
            <div v-for="e in getBotnameSample" :key="e._id">
              <b>{{ e.label }} <small>({{ getUsage(e) }})</small></b>
              <b-progress :max="e.stats.limited" variant="info" height=".8rem" class="mb-3" :animated="e.wait">
                <b-progress-bar :value="e.wait ? 0 : getLimitPercent(e.stats.usage, e.stats.limited)" :label-html="String(e.stats.usage)" />
                <b-progress-bar :value="e.wait ? e.stats.limited : getDayPercent(e.stats.usage, e.stats.limited)" :show-value="false" variant="default" />
              </b-progress>
            </div>
          </b-col>
        </b-row>
      </b-tab>
    </b-tabs>
  </b-container>
</template>

<script>
import numeral from 'numeral'
import moment from 'moment'
import Treeselect from '@riophae/vue-treeselect'

import Api from '../model/api'
import Notify from '../model/notify'
import Bot from '../model/bot'
import Webhook from '../model/webhook'

const dashboard = '/api/service/dashboard'

export default {
  components: {
    Treeselect
  },
  async asyncData ({ env, $axios }) {
    if (!Api.query().first()) {
      await Api.insert({
        data: { id: 1, hostname: env.HOST_API, proxyname: env.PROXY_API || env.HOST_API }
      })

      const { data, status, statusText } = await $axios(dashboard)
      if (status !== 200) { throw new Error(`Server Down '${dashboard}' is ${statusText}.`) }

      for (const item of data.service) {
        await Notify.insert({ data: item })
      }
      for (const item of data.bot) {
        await Bot.insert({ data: item })
      }
      for (const item of data.webhook) {
        await Webhook.insert({ data: item })
      }
    }
    return { }
  },
  data: () => ({
    url2: {
      param: {
        fields: [
          { key: 'field', label: 'Field', tdClass: 'table-col-field' },
          { key: 'type', label: 'Type', tdClass: 'table-col-field' },
          { key: 'description', label: 'Description', tdClass: 'table-col-desc' }
        ],
        items: [
          { field: 'botname', type: 'String', description: 'Botname your register in site.' },
          { field: 'id', type: 'String', description: 'userId, groupId, roomId or replyId' }
        ]
      },
      body: {
        fields: [
          { key: 'field', label: 'Field', tdClass: 'table-col-field' },
          { key: 'type', label: 'Type', tdClass: 'table-col-field' },
          { key: 'description', label: 'Description', tdClass: 'table-col-desc' }
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
          { key: 'field', label: 'Field', tdClass: 'table-col-field' },
          { key: 'type', label: 'Type', tdClass: 'table-col-field' },
          { key: 'description', label: 'Description', tdClass: 'table-col-desc' }
        ],
        items: [
          { field: 'name', type: 'String', description: 'flex name alert or error only.' },
          { field: 'id', type: 'String', description: 'userId, groupId, roomId or replyId' }
        ]
      },
      body: {
        fields: [
          { key: 'field', label: 'Field', tdClass: 'table-col-field' },
          { key: 'type', label: 'Type', tdClass: 'table-col-field' },
          { key: 'description', label: 'Description', tdClass: 'table-col-desc' }
        ],
        items: [
          { field: 'app', type: 'String', description: 'title' },
          { field: 'message', type: 'String', description: 'Message text.' },
          { field: 'detail', type: 'String', description: 'show only error text.' }
        ]
      }
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
    },
    sync: {
      bot: false,
      webhook: false
    }
  }),
  computed: {
    api () {
      return Api.query().first()
    },
    getBotnameSample () {
      return Bot.query().get().map(e => ({ label: e.text, id: e.value, stats: e.stats }))
    },
    getRoomSample () {
      const service = Bot.query().where('value', this.bot.name).get()[0] || {}
      return (service.room || []).map(e => ({ id: e.value, label: e.text }))
    }
  },
  methods: {
    getUsage ({ wait, stats }) {
      return wait ? '...' : numeral(stats.limited - stats.usage).format('0,0')
    },
    getLimitPercent (value, max) {
      return Math.round(value * max / max)
    },
    getDayPercent (value, max) {
      const limit = this.getLimitPercent(value, max)
      const day = Math.round(moment().date() * max / moment().endOf('month').date())
      // value: 0 max: 1000 limit 0 day 3
      return limit >= day ? 0 : day - limit
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
    async onTestBot () {
      if (!this.bot.name || !this.bot.to) { return }
      const { data } = await this.$axios.put(`/${this.bot.name}/${this.bot.to}`, {
        type: 'text',
        text: '*LINE-BOT*\tTesting message.'
      })
      this.bot.test = JSON.stringify(data)
      if (data.error) {
        // eslint-disable-next-line no-console
        return console.log(data.error)
      }
    },
    onSampleChangeFlex (e) {
      this.flex.name = e
    },
    async onTestFlex () {
      if (!this.flex.name || !this.flex.to) { return }
      const { data } = await this.$axios.put(`/flex/${this.flex.name}/${this.flex.to}`, {
        app: 'LINE-BOT',
        message: 'Testing',
        detail: 'message'
      })
      this.flex.test = JSON.stringify(data)
      if (data.error) {
        // eslint-disable-next-line no-console
        return console.log(data.error)
      }
    },
    async onSyncBot () {
      if (this.sync.bot) { return }
      this.sync.bot = true
      for (const e of this.getBotnameSample) {
        e.wait = true
        const { data } = await this.$axios(`/api/stats/bot/${e._id}`)
        e.stats = data
        e.wait = false
      }
      this.sync.bot = false
    }
  }
}
</script>
<style lang="scss" scoped>
.webhook-channel {
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
.bg-default {
  background-color: #ccd0d4;
}

</style>
