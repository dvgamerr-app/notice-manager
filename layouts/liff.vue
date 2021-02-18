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
            <div class="flex-user">
              <span class="text-muted text-username" v-text="profile.displayName" />
              <b-img v-if="profile.userId" :src="profile.pictureUrl" rounded="circle" :alt="profile.statusMessage" style="width:1.2rem;" />
              <fa v-else icon="user-circle" class="text-muted" style="font-size:1.2rem" />
            </div>
          </b-navbar-nav>
        </b-container>
      </b-navbar>
      <b-container class="navbottom" fluid>
        <b-row>
          <b-col class="menu nav nav-pills border-bottom d-none d-md-inline-block" md="12">
            <!-- <nuxt-link to="/" class="nav-link d-md-inline-block" exact>
              <fa icon="home" />
              <span>Dashboard</span>
            </nuxt-link>
            <nuxt-link to="/notify" class="nav-link d-md-inline-block">
              <fa icon="bell" />
              <span><span class="d-none d-lg-inline">LINE</span> Notify</span>
            </nuxt-link>
            <nuxt-link to="/bot" class="nav-link d-md-inline-block">
              <fa :icon="['fab','line']" />
              <span><span class="d-none d-lg-inline">LINE</span> BOT</span>
            </nuxt-link>
            <nuxt-link to="/webhook" class="nav-link d-md-inline-block disabled">
              <fa icon="link" />
              <span>Webhook</span>
            </nuxt-link> -->
          </b-col>
          <b-col class="menu nav nav-pills border-bottom d-flex d-md-none" md="12">
            <!-- <nuxt-link to="/" class="nav-link d-flex justify-content-center d-md-block" exact>
              <fa icon="home" class="fa-lg m-2" />
            </nuxt-link>
            <nuxt-link to="/notify" class="nav-link d-flex justify-content-center d-md-block">
              <fa icon="bell" class="fa-lg m-2" />
            </nuxt-link>
            <nuxt-link to="/bot" class="nav-link d-flex justify-content-center d-md-block">
              <fa :icon="['fab','line']" class="fa-lg m-2" />
            </nuxt-link>
            <nuxt-link to="/webhook" class="nav-link d-flex justify-content-center d-md-block disabled">
              <fa icon="link" class="fa-lg m-2" />
            </nuxt-link> -->
          </b-col>
        </b-row>
      </b-container>
      <nuxt class="main" />
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
      userId: null,
      displayName: null,
      pictureUrl: '',
      statusMessage: null
    }
  }),
  async beforeMount () {
    await this.$liff.init({ liffId: '1607427050-pOvAm7RE' })
    if (!this.$liff.isLoggedIn()) {
      return this.$liff.login({ redirectUri: 'http://localhost:4000/liff' })
    }

    this.profile = await this.$liff.getProfile()
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
  .navbar-brand {
    font-size: 1.2rem;
    line-height: 1rem;
    font-weight: bold;

    .logo-grid {
      display: grid;
      grid-template:
        'main top' 0.6em
        'main bottom' 0.8em / 3em 1fr;
    }
    .logo-main {
      grid-area: main;
      margin-top: 5px;
      font-size: 1.5rem;
    }

    .logo-top {
      grid-area: top;
      font-size: .7rem;
    }

    .logo-bottom {
      grid-area: bottom;
      font-size: .7rem;
    }

  }
}
</style>
