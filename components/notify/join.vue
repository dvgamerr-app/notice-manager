<template>
  <b-form>
    <b-row class="mb-2">
      <b-col>
        <h4>How to add LINE-Notify to room?</h4>
        <ol>
          <li>Add <b>LINE Notify</b> friend.</li>
          <b-img class="qr-code" src="~assets/notify-qr.png" />
          <li class="pt-1 pb-1">
            <b-dropdown dropright :text="`Select Service${ add.service ? ` : ${add.service}` : ''}`" variant="outline-info">
              <b-dropdown-item v-for="e in list()" :key="e._id" href="#" @click.prevent="onChangeService(e)">
                <span v-text="e.name" />
              </b-dropdown-item>
            </b-dropdown>
          </li>
          <li class="pt-1 pb-1">
            <b-input-group>
              <b-input-group-text>Room name</b-input-group-text>
              <b-form-input ref="room" v-model.trim="add.room" size="sm" maxlength="20" :state="check.room" @keyup.enter="onJoinRoom($event)" />
            </b-input-group>
          </li>
          <li>Your line account choose room and click <b>agree and connect</b>.</li>
          <li>Invite <b>LINE Notify</b> to room your select.</li>
        </ol>
        <b-card-text>After your remember step and click <b>join room</b>.</b-card-text>
        <b-link @click="onJoinRoom($event)">
          <fa icon="external-link-alt" /> Join room
        </b-link>
      </b-col>
    </b-row>
  </b-form>
</template>
<script>
import Api from '../../model/api'
import Notify from '../../model/notify'

export default {
  data: () => ({
    check: {
      room: null,
      service: null,
      client_id: null,
      client_secret: null
    },
    btn: {
      submit: false
    },
    add: {
      service: '',
      room: ''
    }
  }),
  // computed: {
  //   getBotnameSample () {
  //     return this.bot
  //   },
  //   getServiceSample () {
  //     return this.list
  //   },
  //   getRoomSample () {
  //     let service = this.list.filter(e => e.service === this.api.notify.service)
  //     return service && service[0] ? service[0].room : []
  //   }
  // },
  methods: {
    list () {
      return Notify.all()
    },
    api () {
      return Api.query().first()
    },
    onChangeService (e) {
      const vm = this
      vm.add.service = e.service
      vm.$nextTick(() => {
        vm.$refs.room.focus()
      })
    },
    showToast (msg) {
      this.$bvToast.toast(msg, {
        toaster: 'b-toaster-bottom-right',
        title: 'LINE-Notify',
        autoHideDelay: 3000,
        solid: true,
        variant: 'warning'
      })
    },
    checkName (name) {
      return !/[^0-9a-z.-]+/g.test(name)
    },
    async onJoinRoom (e) {
      if (!this.add.service) {
        this.showToast('Select service name in dropdown.')
        return e.preventDefault()
      }
      if (!this.add.room) {
        this.check.room = false
        this.showToast('Input room name.')
        return e.preventDefault()
      }
      if (!this.checkName(this.add.room)) {
        this.check.room = false
        this.showToast('Name verify a-z,0-9, and - .')
        return e.preventDefault()
      }
      const { data } = await this.$axios.post('/api/service/check', { room: this.add.room, service: this.add.service })
      if (data.error) {
        this.check.room = false
        this.showToast(data.error)
        return e.preventDefault()
      }
      this.check.room = true
      window.location.href = `/register-bot/${this.add.service}/${this.add.room || ''}`
      return e.preventDefault()
      // this.$router.push(`/register-bot/${this.add.service}/${this.add.room || ''}`, () => this.$router.go(0))
    }
  }
}
</script>
