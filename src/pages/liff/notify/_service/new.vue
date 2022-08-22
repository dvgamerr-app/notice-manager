<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12" class="notify py-3">
      <b-form>
        <b-row>
          <b-col cols="12">
            <h3>วิธีใช้ service ที่สร้าง join เข้ากลุ่มที่ต้องการใช้งาน</h3>
          </b-col>
          <b-col>
            <ol>
              <li>
                Add <strong>LINE Notify</strong> friend from
                <strong>QR Code</strong>.
              </li>
              <li>
                Input name from room to join in <strong>{{ service }}</strong>.
              </li>
              <li class="pt-1 pb-1">
                <b-row>
                  <b-col>
                    <b-input-group>
                      <b-input-group-text>Room</b-input-group-text>
                      <b-form-input
                        ref="room"
                        v-model.trim="roomName"
                        maxlength="20"
                        :state="check.room"
                        @keyup.enter="onJoinRoom($event)"
                      />
                    </b-input-group>
                  </b-col>
                </b-row>
              </li>
              <li>
                Your line account choose room and click
                <strong>agree and connect</strong>.
              </li>
              <li>Invite <strong>LINE Notify</strong> to room your select.</li>
            </ol>
          </b-col>
          <b-col cols="12">
            <p>After your remember step and click <strong>join room</strong>.</p>
            <b-btn variant="info" block @click="onJoinRoom($event)">
              <fa icon="external-link-alt" /> Join room
            </b-btn>
          </b-col>
        </b-row>
      </b-form>

    </b-col>
  </b-row>
</template>

<script>
export default {
  layout: 'liff',
  transition: 'fade',
  asyncData ({ params, env }) {
    return Object.assign(params, { env })
  },
  data: () => ({
    check: {
      room: null,
      service: null,
      client_id: null,
      client_secret: null
    },
    roomName: '',
    btn: {
      submit: false
    }
  }),
  computed: {
    profile () {
      return this.$store.state.profile
    }
  },
  methods: {
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
      if (!this.service) {
        this.showToast('Select service name in dropdown.')
        return e.preventDefault()
      }
      if (!this.roomName) {
        this.check.room = false
        this.showToast('Input room name.')
        return e.preventDefault()
      }
      if (!this.checkName(this.roomName)) {
        this.check.room = false
        this.showToast('Name verify a-z,0-9, and - .')
        return e.preventDefault()
      }
      const { data } = await this.$axios('/api/notify/check', {
        method: 'POST',
        validateStatus: () => true,
        data: { room: this.roomName, service: this.service }
      })
      if (data.error) {
        this.showToast(data.error)
        this.check.room = false
        return e.preventDefault()
      }
      this.check.room = true
      this.$liff.openWindow({
        url: `${this.env.baseUrl}/register/${this.service}/${this.roomName}`,
        external: true
      })

      this.$store.commit('lineNotifyAddRoom', {
        service: this.service,
        room: { name: this.roomName, room: this.roomName }
      })

      this.$router.push(`/liff/notify/${this.service}`)
      return e.preventDefault()
    }
  }
}
</script>
<style lang="scss"></style>
