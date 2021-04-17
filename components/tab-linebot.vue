<template>
  <b-form>
    <b-row class="mb-2">
      <b-col>
        <h4>How to create new Line bot?</h4>
        <ol>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Name</b-input-group-text>
              <b-form-input v-model.trim="row.name" maxlength="40" size="sm" :state="check.service" @keyup.enter="onSubmitBot($event)" />
            </b-input-group>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Client ID</b-input-group-text>
              <b-form-input v-model.trim="row.client_id" maxlength="32" size="sm" :state="check.client_id" @keyup.enter="onSubmitBot($event)" />
            </b-input-group>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Client Secret</b-input-group-text>
              <b-form-input v-model.trim="row.client_secret" maxlength="64" size="sm" :state="check.client_secret" @keyup.enter="onSubmitBot($event)" />
            </b-input-group>
          </li>
        </ol>
        <b-btn :variant="btn.submit ? 'outline-secondary' : 'primary'" :disabled="btn.submit" @click="onSubmitBot($event)">
          <font-awesome-icon v-if="btn.submit" icon="circle-notch" spin /> Create LINE BOT
        </b-btn>
      </b-col>
    </b-row>
  </b-form>
</template>
<script>
export default {

}
</script>
