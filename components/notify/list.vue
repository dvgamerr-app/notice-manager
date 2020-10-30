<template>
  <div>
    <div v-if="!list() || list().length == 0" class="mb-2" style="color: #989898;font-size:.9rem;">
      No service notify.
    </div>
    <div v-for="e in list()" :key="e._id" @mouseover="() => edit.show = e._id" @mouseleave="() => edit.show = null">
      <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center border-bottom mb-1">
        <h6 v-text="e.text" />
        <div v-if="edit.show === e._id" class="menu-notify">
          <b-btn class="edit" variant="icon" size="sm" @click="onUpdateName(e)">
            <fa icon="edit" />
          </b-btn>
          <b-btn v-b-modal="'trash-' + e._id" class="trash" variant="icon" size="sm">
            <fa icon="trash-alt" />
          </b-btn>
        </div>
        <b-modal
          :id="'trash-' + e._id" title="Delete service?" no-fade
          ok-title="Sure, Delete it." cancel-title="No, Thank."
          ok-variant="danger" cancel-variant="default"
        >
          Your want to delete service '{{ e.text }}' ?
        </b-modal>
      </div>
      <ul class="line-notify">
        <li v-if="!e.room || e.room.length == 0" style="color: #989898;">
          No room join.
        </li>
        <li v-for="r in e.room" :key="r._id">
          <b-btn v-if="btn.trash !== r._id" variant="icon" size="sm" @click.prevent="onTrash(r)">
            <fa :icon="btn.remove !== r._id ? 'trash-alt' : 'circle-notch'" :spin="btn.remove === r._id" />
          </b-btn>
          <div v-else style="display: inline;">
            <b-btn variant="icon" size="sm" @click.prevent="onCancelTrash()">
              <fa icon="times" />
            </b-btn>
            <b-btn variant="icon" class="text-danger" size="sm" @click.prevent="onApplyTrash(r)">
              <fa icon="trash-alt" />
            </b-btn>
          </div>
          {{ r.value }} ({{ r.text }})
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import Api from '../../model/api'
import Notify from '../../model/notify'

export default {
  data: () => ({
    btn: {
      trash: null
    },
    add: {
      value: ''
    },
    edit: {
      show: null,
      value: '',
      text: '',
      mode: null
    }
  }),
  methods: {
    api () {
      return Api.query().first()
    },
    list () {
      return Notify.all()
    },
    onChangeService (e) {
      const vm = this
      vm.add.value = e.value
      vm.$nextTick(() => {
        vm.$refs.room.focus()
      })
    },
    async onSaveName (e) {
      await this.$axios.post('/api/service/update', { name: this.edit.value, _id: e._id })
      this.edit.mode = null
      this.edit.text = ''
      this.edit.service = ''
    },
    onUpdateName (e) {
      this.edit.mode = e._id
      this.edit.text = e.text
      this.edit.value = e.value
    },
    onTrash (r) {
      this.btn.trash = r._id
      this.$forceUpdate()
    },
    onCancelTrash () {
      this.btn.trash = null
      this.$forceUpdate()
    },
    async onApplyTrash (r) {
      this.btn.trash = null
      this.btn.remove = r._id
      const { data } = await this.$axios.put(`/revoke/${r.service}/${r.value}`, { revoke: 'agree' })
      if (data.error) {
        // eslint-disable-next-line no-console
        return console.log(data.error)
      }

      this.$emit('dataUpdate')
      this.btn.remove = null
    }
  }
}
</script>

<style lang="scss" scoped>
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
.edit-name {
  border-color: transparent;
  outline: 0;
  box-shadow: none;
  font-size: .9rem;
  padding: 2px 6px;
  height: auto;
}
</style>
