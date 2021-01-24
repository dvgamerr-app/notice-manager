<template>
  <b-container fluid class="d-flex justify-content-center">
    <b-col md="4">
      <h5>
        <fa :icon="['fab','line']" /> <b>LINE BOT</b>
        <b-btn variant="icon" size="sync" @click="onSyncBot">
          <fa icon="sync-alt" :spin="sync.bot" />
        </b-btn>
      </h5>
      <div v-if="!bot || bot.length == 0" class="mb-2" style="color: #989898;font-size:.9rem;">
        No bot line.
      </div>
      <div v-for="e in getBotnameSample" :key="e._id">
        <b>{{ e.text }} <small>({{ getUsage(e) }})</small></b>
        <b-progress :max="e.stats.limited" variant="info" height=".8rem" class="mb-3" :animated="e.wait">
          <b-progress-bar :value="e.wait ? 0 : getLimitPercent(e.stats.usage, e.stats.limited)" :label-html="String(e.stats.usage)" />
          <b-progress-bar :value="e.wait ? e.stats.limited : getDayPercent(e.stats.usage, e.stats.limited)" :show-value="false" variant="default" />
        </b-progress>
      </div>
    </b-col>
  </b-container>
</template>

<script>
import Bot from '../model/bot'

export default {
  computed: {
    getBotnameSample () {
      return Bot.query().get().map(e => ({ label: e.text, id: e.value, stats: e.stats }))
    }
  },
  async created () {
  }
}
</script>
