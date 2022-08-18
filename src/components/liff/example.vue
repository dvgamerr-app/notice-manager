<template>
  <b-row>
    <b-col>
      <b-card>
        <h4 class="card-title">
          cURL.exe <small>(windows)</small>
        </h4>
        <div class="sample-code">
          <pre>
curl -X PUT {{
              url
          }} -H "Content-Type: application/json" -d "{ \"message\": \"Testing Message\" }"</pre>
        </div>
        <h4>ทดสอบ</h4>
        <b-form class="sample-send">
          <b-row>
            <b-col>
              <label class="mr-2">Service: <strong>{{ service }}</strong></label>
              <label class="mr-2">Room: <strong>{{ room }}</strong></label>
            </b-col>
          </b-row>
          <b-row>
            <b-col>
              <b-button
                :variant="sended ? 'outline-secondary' : 'warning'"
                block
                :disabled="sended"
                @click="onSendNotify"
              >
                <b-spinner v-show="sended" class="send-spin" />
                {{ sended ? 'Sending...' : 'Send' }} "Testing Message"
              </b-button>
            </b-col>
          </b-row>
        </b-form>
        <h6 class="mt-3 mb-0">
          Response
        </h6>
        <div class="sample-code">
          <pre>{{ response || '[After sending request]' }}</pre>
        </div>
      </b-card>
    </b-col>
  </b-row>
</template>
<script>
export default {
  props: {
    url: {
      type: String,
      default: () => '[URL]'
    },
    service: {
      type: String,
      default: () => '[SERVICE]'
    },
    room: {
      type: String,
      default: () => '[ROOM]'
    }
  },
  data () {
    return {
      sended: false,
      response: ''
    }
  },
  methods: {
    async onSendNotify () {
      if (!this.service || !this.room) {
        return
      }
      this.sended = true
      const { status, data } = await this.$axios.put(
        `/notify/${this.service}/${this.room}`,
        {
          message: '*LINE-Notify*\nTesting message.',
          sticker: true
        }
      )
      this.response = JSON.stringify(data, null, 2)
      this.sended = false
      if (status !== 200) {
        this.showToast('Invalid request notify.')
        // eslint-disable-next-line no-console
        return console.error(data)
      }
    }
  }
}
</script>

<style lang="scss">
.sample-code {
  > pre {
    font-size: 0.75rem;
    display: flex;
    word-break: break-word;
  }
}
.sample-send {
  .send-spin {
    left: calc(50% - 95px) !important;
    top: 10px !important;
    width: 17px;
    height: 17px;
    border-width: 0.2em;
  }
}
</style>
