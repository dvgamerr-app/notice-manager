<template>
  <b-form>
    <b-row class="mb-2 mt-5">
      <b-col cols="9">
        <h3>วิธีใช้ service ที่สร้าง join เข้ากลุ่มที่ต้องการใช้งาน</h3>
        <ol>
          <li>Add <b>LINE Notify</b> friend from <b>QR Code</b>.</li>
          <li class="pt-1 pb-1">
            <b-row>
              <b-col cols="5">
                <treeselect v-model="add.service" :options="getServiceSample" placeholder="Select service" />
              </b-col>
              <b-col cols="7">
                <b-input-group>
                  <b-input-group-text>Room</b-input-group-text>
                  <b-form-input ref="room" v-model.trim="add.room" maxlength="20" :state="check.room" @keyup.enter="onJoinRoom($event)" />
                </b-input-group>
              </b-col>
            </b-row>
          </li>
          <li>Your line account choose room and click <b>agree and connect</b>.</li>
          <li>Invite <b>LINE Notify</b> to room your select.</li>
        </ol>
        <p>After your remember step and click <b>join room</b>.</p>
        <b-link @click="onJoinRoom($event)">
          <fa icon="external-link-alt" /> Join room
        </b-link>
      </b-col>
      <b-col cols="3">
        <b-img class="qr-code" src="~assets/notify-qr.png" />
      </b-col>
    </b-row>
  </b-form>
</template>
<script>
import Treeselect from '@riophae/vue-treeselect'
import Notify from '../../model/notify'

export default {
  components: { Treeselect },
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
      service: null,
      room: null
    }
  }),
  computed: {
  //   getBotnameSample () {
  //     return this.bot
  //   },
    getServiceSample () {
      return Notify.query().get().map(e => ({ id: e.value, label: e.text }))
    },
    getRoomSample () {
      const service = Notify.query().get().filter(e => e.value === this.api.notify.service)
      return service && service[0] ? service[0].room : []
    }
  },
  methods: {
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
        title: 'LINE-Notice',
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
        this.showToast(/.*?\n/ig.exec(data.error)[0])
        return e.preventDefault()
      }
      this.check.room = true
      window.location.href = `/register/${this.add.service}/${this.add.room || ''}`
      return e.preventDefault()
      // this.$router.push(`/register/${this.add.service}/${this.add.room || ''}`, () => this.$router.go(0))
    }
  }
}
</script>
