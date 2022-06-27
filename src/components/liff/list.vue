<template>
  <b-row v-if="!$store.state.wait">
    <b-col sm="12">
      <b-row v-if="countItem && !err">
        <b-col :cols="type != 'all' ? 9 : 12" class="pt-3 mb-1">
          <fa icon="search" class="fa-sm icon-search" />
          <b-form-input v-model="search" placeholder="Search" style="padding-left:2em" />
        </b-col>
        <b-col v-if="type != 'all'" cols="3" class="pl-0 pt-3 mb-1">
          <b-button :to="`/liff/${type}/new`" variant="primary" block class="btn-new">
            <fa icon="plus" class="d-sm-inline-block d-none" /> <span>Create</span>
          </b-button>
        </b-col>
      </b-row>
    </b-col>
    <b-col sm="12" class="pb-3">
      <nuxt-link v-if="!countItem || err" :event="''" to="#" class="d-block list-item empty py-3 border-bottom">
        {{ err || 'Empty.' }}
      </nuxt-link>
      <lazy-liff-item-drop v-for="e in getItem()" :key="e.$id" @delete="onRemove(e)">
        <nuxt-link :to="`/liff/${e.type}/${e.value}${type == 'all' ? `?view=1` : ''}`" class="d-flex align-items-center list-item py-3">
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
// import Notify from '../../model/notify'
// import Bot from '../../model/bot'

export default {
  props: {
    type: {
      type: String,
      default: () => 'all'
    },
    err: {
      type: String,
      default: () => null
    }
  },
  data () {
    return {
      search: ''
    }
  },
  computed: {
    getTypeBot () {
      return this.type === 'all' || this.type === 'bot'
    },
    getTypeNotify () {
      return this.type === 'all' || this.type === 'notify'
    },
    countItem () {
      const { lineNotify, lineBot } = this.$store.state
      return (this.getTypeBot ? lineBot.length : 0) + (this.getTypeNotify ? lineNotify.length : 0)
    }
  },
  created () {
    // eslint-disable-next-line no-console
    console.log('list:', this.type)
  },
  methods: {
    getItem () {
      const { lineNotify, lineBot } = this.$store.state
      let data = []
      if (this.type === 'all' || this.type === 'notify') { data = data.concat(...lineNotify) }
      if (this.type === 'all' || this.type === 'bot') { data = data.concat(...lineBot) }
      return data.filter((e) => {
        return new RegExp(this.search, 'ig').test(e.text) || new RegExp(this.search, 'ig').test(e.value)
      }).sort((a, b) => a.value > b.value ? 1 : -1)
    },
    onRemove (e) {
      // eslint-disable-next-line no-console
      console.log(e)
    }
  }
}
</script>
<style lang="scss">
.btn-new {
  > svg {
    margin-bottom: -2px;
    font-size: 1.1rem;
  }
  > span {
    font-size: 1.2rem;
    line-height: 1rem;
  }
}
.icon-search {
  color: #ced4da;
}
.list-item {
  color: var(--dark);
  font-size: 1.5rem;
  cursor: pointer;

  &:hover {
    color: var(--dark);
    background-color: #f3f7f9;
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
</style>
