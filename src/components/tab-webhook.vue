<template>
  <b-form horizontal>
    <h4>How to add webhook?</h4>
    <b-row class="mb-2">
      <b-col>
        <b-form-group
          label-cols-lg="2"
          label-cols-sm="2"
          label-cols="3"
          label-size="sm"
          label="Type:"
          label-for="input-sm"
        >
          <b-form-input
            id="input-sm"
            v-model.trim="row.type"
            size="sm"
            maxlength="40"
          />
        </b-form-group>
      </b-col>
      <b-col>
        <b-form-group
          label-cols-lg="2"
          label-cols-sm="2"
          label-cols="3"
          label-size="sm"
          label="Name:"
          label-for="input-sm"
        >
          <b-form-input
            id="input-sm"
            v-model.trim="row.webhook"
            size="sm"
            maxlength="40"
          />
        </b-form-group>
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col>
        <b-form-group
          label-cols-lg="1"
          label-cols-sm="1"
          label-cols="1"
          label-size="sm"
          label="URL:"
          label-for="input-sm"
        >
          <b-form-input
            id="input-sm"
            v-model.trim="row.url"
            size="sm"
            maxlength="500"
          />
        </b-form-group>
      </b-col>
    </b-row>
    <b-btn
      :variant="btn.webhook ? 'outline-secondary' : 'primary'"
      :disabled="btn.webhook"
      @click="onSubmitWebhook($event)"
    >
      <fa v-if="btn.webhook" icon="circle-notch" spin /> Add Webhook
    </b-btn>
  </b-form>
</template>
<script>
export default {}
</script>
