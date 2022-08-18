<template>
  <div>
    <h4><fa icon="bell" /> <b>LINE Notify</b></h4>
    <h5 class="mt-1">
      Push Notify API
    </h5>
    <pre
      class="language-html"
      data-type="put"
    ><code class="text-white">/notify/:service/:room</code></pre>
    <h6>Parameter</h6>
    <b-table bordered small :items="param.items" :fields="param.fields" />
    <h6>Body</h6>
    <b-table bordered small :items="body.items" :fields="body.fields" />
    <h6>Example code</h6>
    <p class="sample-code p-2 mt-1 border">
      <code>
        curl -X PUT {{ api().proxyname }}/notify/{{
          sample.service ? sample.service : '[service_name]'
        }}/{{ sample.room ? sample.room : '[room_id]' }} -H "Content-Type:
        application/json" -d "{ \"message\": \"Testing\nMessage\" }"
      </code>
    </p>
    <slot name="sample" />
  </div>
</template>

<script>
// import Api from '../../model/api'

export default {
  props: {
    sample: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    param: {
      fields: [
        { key: 'field', label: 'Field', tdClass: 'table-col-field' },
        { key: 'type', label: 'Type', tdClass: 'table-col-field' },
        { key: 'description', label: 'Description', tdClass: 'table-col-desc' }
      ],
      items: [
        { field: 'service', type: 'String', description: 'Service name' },
        { field: 'room', type: 'String', description: 'Room name.' }
      ]
    },
    body: {
      fields: [
        { key: 'field', label: 'Field', tdClass: 'table-col-field' },
        { key: 'type', label: 'Type', tdClass: 'table-col-field' },
        { key: 'description', label: 'Description', tdClass: 'table-col-desc' }
      ],
      items: [
        {
          field: 'message',
          type: 'String',
          description: 'Message to line notify.'
        }
      ]
    }
  }),
  methods: {
    api () {
      return {}
      // return Api.query().first()
    }
  }
}
</script>
