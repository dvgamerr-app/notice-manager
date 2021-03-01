<template>
  <transition name="fade">
    <div>
      <client-only>
        <div slot="placeholder">
          <b-spinner variant="success" />
        </div>
        <b-navbar v-if="$store.state.full" class="navtop">
          <b-container fluid>
            <b-navbar-brand>
              <div class="logo-grid d-grid">
                <span class="logo-main">LINE</span>
                <span class="logo-top">Notice</span>
                <span class="logo-bottom">MANAGER</span>
              </div>
            </b-navbar-brand>
            <b-navbar-nav class="ml-auto">
              <div v-if="profile.userId" class="flex-user">
                <span class="text-muted text-username" v-text="profile.displayName" />
                <b-img :src="profile.pictureUrl" rounded="circle" alt="A" style="width:1.2rem;" />
              </div>
            </b-navbar-nav>
          </b-container>
        </b-navbar>
        <b-container v-else class="navtop" />
        <b-container class="navbottom" />
        <b-container class="main">
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
  </transition>
</template>
<script>
export default {
  transition: 'fade',
  data: () => ({
  }),
  computed: {
    profile () {
      return this.$store.state.profile
    }
  },
  methods: {
    loggedIn () {
      return this.$liff.isLoggedIn()
    }
  }
}
</script>

<style lang="scss">
@import '../assets/fonts/stylesheet.css';

body {
  .main {
    font-family: "thaisansneue-semibold", "Open Sans", Tahoma, Geneva, Verdana, sans-serif;
    font-weight: normal;
    font-size: 1.2rem;
  }
  strong {
    font-family: 'thaisansneue-ultrabold';
  }
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
