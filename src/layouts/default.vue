<template>
  <div>
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
          <div v-if="loggedIn" class="flex-user">
            <span class="text-muted text-username" v-text="username" />
            <fa icon="user-circle" class="text-muted" style="font-size:1.2rem" />
          </div>
          <div v-else>
            <!-- <b-link href="/auth/sso" class="flex-sign">
              <fa icon="external-link-alt" /> Sign-In
            </b-link> -->
          </div>
        </b-navbar-nav>
      </b-container>
    </b-navbar>
    <b-container class="navbottom" fluid>
      <b-row>
        <!-- <b-col class="menu nav nav-pills border-bottom d-none d-md-inline-block" md="12">
          <nuxt-link to="/" class="nav-link d-md-inline-block" exact>
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
          </nuxt-link>
        </b-col>
        <b-col class="menu nav nav-pills border-bottom d-flex d-md-none" md="12">
          <nuxt-link to="/" class="nav-link d-flex justify-content-center d-md-block">
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
          </nuxt-link>
        </b-col> -->
      </b-row>
    </b-container>
    <b-container>
      <b-row>
        <b-col>
          <nuxt class="markdown-body" />
        </b-col>
      </b-row>
    </b-container>
    <footer class="footer">
      <b-container fluid>
        <p>
          <span class="d-none d-md-inline-block">
            The source code is licensed <a href="http://opensource.org/licenses/mit-license.php">MIT</a>,
          </span>
          Design By <a href="https://mr.touno.io/" target="_blank">Kananek T.</a> <small>(LINE-BOT v{{ require('../../package.json').version }})</small>
        </p>
      </b-container>
    </footer>
  </div>
</template>
<script>
export default {
  computed: {
    loggedIn () {
      return false
    },
    username () {
      return ''
    }
  },
  created () {
  }
}
</script>

<style lang="scss">
@import '../assets/fonts/stylesheet.css';

body .main {
  font-family: "thaisansneue-semibold", "Open Sans", Tahoma, Geneva, Verdana, sans-serif;
  font-weight: normal;
  font-size: 1.2rem;
}

#__layout > div {
  grid-template:
    "navtop" auto
    "navbottom" auto
    "main-content" 1fr
    "footer" 32px;

  .spinner-border {
    position: absolute;
    top: calc(50% - 20px);
    left: calc(50% - 20px);
  }
}
footer {
  background: #fafbfc;
  border-top: 1px solid #e6e6e6;
  color: #a3a6ad;
  margin-top: -2px;
  a, a:hover {
    color: #16c464;
  }
  p {
    padding: 8px 0;
    margin: 0px;
    font-size: .65rem;
  }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s;
}
.page-enter,
.page-leave-to {
  opacity: 0;
}

.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.2s;
}
.layout-enter,
.layout-leave-to {
  opacity: 0;
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
