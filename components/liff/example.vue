<template>
  <b-row>
    <b-col>
      <b-card>
        <h4 class="card-title">
          cURL.exe <small>(windows)</small>
        </h4>
        <p class="sample-code">
          <pre>curl -X PUT {{ url }} -H "Content-Type: application/json" -d "{ \"message\": \"Testing Message\" }"</pre>
        </p>
        <h4>
          ทดสอบ
        </h4>
        <b-form inline>
          <label class="mr-2">Service: <strong>{{ service }}</strong></label>
          <label class="mr-2">Room: <strong>{{ room }}</strong></label>
          <b-button variant="warning" block>
            Send "Testing Message"
          </b-button>
        </b-form>
        <h6 class="mt-3 mb-0">
          Response
        </h6>
        <p class="sample-code markdown-body">
          <pre>[After sending request]<!-- {{ response || '[show after click testing api.]' }} --></pre>
        </p>
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
  }
}
</script>

<style lang="scss">
.sample-code {
  > pre {
    font-size: .85rem;
  }
}
</style>
