<template>
  <div>
    <client-only>
      <div slot="placeholder" class="main-content d-flex justify-content-center pt-5">
        <b-spinner />
      </div>
      <b-navbar class="navtop">
        <b-container fluid>
          <b-navbar-brand to="/">
            <div class="logo-grid d-grid">
              <span class="logo-main">LINE</span>
              <span class="logo-top">Notice</span>
              <span class="logo-bottom">MANAGER</span>
            </div>
          </b-navbar-brand>
          <b-navbar-nav class="ml-auto">
            <div v-if="profile.userId" class="flex-user">
              <span class="text-muted text-username" v-text="profile.displayName" />
              <b-img :src="profile.pictureUrl" rounded="circle" :alt="profile.statusMessage" style="width:1.2rem;" />
            </div>
          </b-navbar-nav>
        </b-container>
      </b-navbar>
      <b-container class="navbottom" />
      <b-container class="main d-flex">
        <nuxt />
      </b-container>
      <footer class="footer">
        <b-container fluid>
          <p>
            LINE-BOT v{{ require('../package.json').version }}
          </p>
        </b-container>
      </footer>
    </client-only>
  </div>
</template>
<script>
export default {
  data: () => ({
    profile: {
      // userId: null,
      // displayName: null,
      // pictureUrl: '',
      // statusMessage: null
      userId: 'U9e0a870c01ca97da20a4ec462bf72991',
      displayName: 'KEM',
      pictureUrl: 'https://profile.line-scdn.net/0hUG0jVRsoCmgNEyOtVq…6PQwgdX1GW3sWAAp3I0s6YSBCCSgUXQ0gIERuMXMWXSkaVV8l', 
      statusMessage: 'You wanna make out.'
    }
  }),
  async beforeMount () {
    await this.$liff.init({ liffId: '1607427050-pOvAm7RE' })
    // if (!this.$liff.isLoggedIn()) {
    //   return this.$liff.login({ redirectUri: 'http://localhost:4000/liff' })
    // }

    // this.profile = await this.$liff.getProfile()
    // console.log('liff.getOS', liff.getOS())
    // console.log('liff.getLanguage', liff.getLanguage())
    // console.log('liff.getVersion', liff.getVersion())
    // console.log('liff.getLineVersion', liff.getLineVersion())
    // console.log('liff.isInClient', liff.isInClient())
    // console.log('liff.isApiAvailable', liff.isApiAvailable('shareTargetPicker'))
  },
  methods: {
    async loggedIn () {
      await this.$liff.init({ liffId: '1607427050-pOvAm7RE' })
      return this.$liff.isLoggedIn()
    }
  }
}
</script>

<style lang="scss" scoped>
#__layout > div {
  grid-template:
    "navtop" auto
    "navbottom" auto
    "main-content" 1fr
    "footer" 32px;
}
footer {
  background: #fafbfc;
  border-top: 1px solid #e6e6e6;
  color: #a3a6ad;
  a, a:hover {
    color: #16c464;
  }
  p {
    padding: 8px 0;
    margin: 0px;
    font-size: .65rem;
  }
}

.nav-link {
  &.d-flex{
    flex: 1;
  }
}

.navbar {
  .flex-user {
    vertical-align: middle;
    display: flex;
  }
  .flex-sign {
    font-weight: bold;
  }

  .text-username {
    font-size: .8rem;
    font-weight: bold;
    margin-right: 6px;
  }

  border-bottom: 1px solid #edeff0;
}
</style>
