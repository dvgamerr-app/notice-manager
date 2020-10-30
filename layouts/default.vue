<template>
  <div>
    <header>
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
            <b-nav-item to="/">
              <font-awesome-icon :icon="['fas', 'user-circle']" />
              <fa icon="user-circle" class="text-muted" style="font-size:1.2rem" />
            </b-nav-item>
          </b-navbar-nav>
        </b-container>
      </b-navbar>
      <b-container fluid>
        <b-row>
          <b-col class="menu nav nav-pills border-bottom" md="12">
            <nuxt-link to="/notify" class="nav-link">
              <fa icon="bell" /> <span class="d-none d-md-inline">LINE</span> Notify
            </nuxt-link>
            <nuxt-link to="/bot" class="nav-link">
              <fa :icon="['fab','line']" /> <span class="d-none d-md-inline">LINE</span> BOT
            </nuxt-link>
            <nuxt-link to="/webhook" class="nav-link">
              <fa icon="link" /> Webhook
            </nuxt-link>
          </b-col>
        </b-row>
      </b-container>
    </header>
    <client-only>
      <div slot="placeholder" class="main d-flex justify-content-center m-5">
        <b-spinner />
      </div>
      <nuxt class="main" />
    </client-only>
    <footer>
      <b-container fluid>
        <p>
          The source code is licensed <a href="http://opensource.org/licenses/mit-license.php">MIT</a>,
          Design By <a href="https://mr.touno.io/" target="_blank">Kananek T.</a> <small>(LINE-BOT v{{ require('../package.json').version }})</small>
        </p>
      </b-container>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
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
