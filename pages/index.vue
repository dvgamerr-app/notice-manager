<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <b-container class="my-3 markdown-body" v-html="getReadme()" />
</template>

<script>
import marked from 'marked'

export default {
  async asyncData () {
  },
  data: () => ({
    readme: `
# LINE-BOT and LINE Notify Web GUI
สร้าง http api แบบง่ายๆ โดยใช้เพียง url webhook เท่านั้น

### Supported
- LINE Notify
- LINE BOT \`feature\`
- Discord \`feature\`
- Telegram \`feature\`

## UI Sample

| Notify | Room | Detail |
| --- | ----------- | ----------- |
| ![notify](/liff-notify.png) | ![room](/liff-room.png) | ![detail](/liff-detail.png) |

## Rich Menu

![richmenu](/richmenu.jpg)
`
  }),
  methods: {
    getReadme () {
      return marked(this.readme)
    }
  }
}
</script>

<style lang="scss">
@import url("~/assets/scss/github-markdown.css");

.markdown-body {
  img {
    max-width:100%;
    max-height:100%;
  }
  code {
    font-size: 0.85rem;
  }
}
</style>
