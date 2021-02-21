<template>
  <b-row v-if="!$store.state.wait">
    <b-col v-if="listItems.length || search.length" sm="12" class="pt-3">
      <fa icon="search" class="fa-sm icon-search" />
      <b-form-input v-model="search" placeholder="Search" style="padding-left:2em" />
    </b-col>
    <b-col sm="12" class="pb-3">
      <nuxt-link v-if="!listItems.length" to="/liff" class="d-block list-item empty py-3 border-bottom">
        Empty.
      </nuxt-link>
      <lazy-liff-item-drop v-for="e in listItems" :key="e.$id" @delete="onRemove(e)">
        <nuxt-link :to="`/liff/${e.type}/${e.value}`" class="d-flex align-items-center list-item py-3 border-bottom">
          <div class="icon px-1">
            <fa v-if="e.type == 'notify'" icon="bell" />
            <fa v-if="e.type == 'bot'" :icon="['fab','line']" />
            <fa v-if="e.type == 'webhook'" icon="link" />
          </div>
          <div class="flex-grow-1 px-2">
            <div class="display" v-text="e.text" />
            <div class="name text-muted">
              <small>{{ e.value }} used join {{ e.room.length }} rooms.</small>
            </div>
          </div>
          <nuxt-link v-show="type != 'all'" :to="`/liff/${e.type}/${e.value}/edit`" class="py-3 px-4 config">
            <fa icon="cog" class="fa-sm text-black-50" />
          </nuxt-link>
        </nuxt-link>
      </lazy-liff-item-drop>
    </b-col>
  </b-row>
</template>

<script>
// import Api from '../model/api'
import Notify from '../../model/notify'
import Bot from '../../model/bot'

export default {
  props: {
    type: {
      type: String,
      default: () => 'all'
    }
  },
  data () {
    return {
      search: 'notify'
    }
  },
  computed: {
    listItems () {
      const n = this.type === 'all' || this.type === 'notify' ? Notify.query().where('removed', false).withAll().get() : []
      const b = this.type === 'all' || this.type === 'bot' ? Bot.query().where('removed', false).withAll().get() : []
      return ([...n, ...b]).filter((e) => {
        return new RegExp(this.search, 'ig').test(e.text) || new RegExp(this.search, 'ig').test(e.value)
      }).sort((a, b) => a.value > b.value ? 1 : -1)
    },
    profile () {
      return this.$store.state.profile
    }
  },
  methods: {
    onRemove (e) {
      // eslint-disable-next-line no-console
      console.log(e)
    }
  }
}
</script>
<style lang="scss">
.icon-search {
  color: #ced4da;
}
.list-item {
  color: var(--dark);
  font-size: 1.5rem;
  cursor: pointer;

  &:hover {
    color: var(--dark);
    background-color: #f2f2f2;
    text-decoration: none;
  }

  &.empty {
    text-align: center;
    cursor: default;
    color: #c2c2c2;
    background-color: transparent !important;
  }

  .icon {
    font-size: 1rem;
    color: #CCCCCC;
  }
  .display {
    line-height: .8;
    font-weight: bold;
  }
  .name {
    line-height: .8;
  }
  .badge {
    font-family: 'Segoe UI';
    font-size: .85rem;
  }
  .config {
    margin: -15px 0 -15px 0;
  }
}
.list-item:last-child {
  border-color: transparent !important;
}
</style>
