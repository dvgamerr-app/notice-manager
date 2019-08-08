<template>
  <div>
    <header>
      <b-navbar>
        <b-container fluid>
          <b-navbar-brand href="/">
            <span class="logo-main">LINE</span>
            <span class="logo-bottom">MANAGER</span>
            <span class="logo-top">Notify</span>
          </b-navbar-brand>
              
          <b-navbar-nav class="ml-auto">
            <b-nav-item to="/">
              <fa icon="user-circle" class="text-muted" style="font-size:1.2rem" />
            </b-nav-item>
          </b-navbar-nav>
        </b-container>
      </b-navbar>
    </header>
    <no-ssr>
      <div slot="placeholder" class="d-flex justify-content-center m-5">
        <b-spinner />
      </div>
      <nuxt />
      <footer class="mt-3">
        <b-container fluid>
          <p>
            The source code is licensed <a href="http://opensource.org/licenses/mit-license.php">MIT</a>,
            Design By <a href="https://mr.touno.io/" target="_blank">Kananek T.</a> <small>(LINE-BOT v{{ require('../package.json').version }})</small>
          </p>
        </b-container>
      </footer>
    </no-ssr>
  </div>
</template>
