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
            <b-nav-item to="/" :active="$route.name == 'index'">
              Dashboard
            </b-nav-item>
            <b-nav-item to="/documentation" :active="$route.name == 'documentation'">
              Documentation
            </b-nav-item>
          </b-navbar-nav>
        </b-container>
      </b-navbar>
    </header>
    <nuxt />
    <footer class="mt-3">
      <b-container fluid>
        <p>
          The source code is licensed <a href="http://opensource.org/licenses/mit-license.php">MIT</a>,
          Design By <a href="https://mr.touno.io/" target="_blank">Kananek T.</a>
        </p>
      </b-container>
    </footer>

  </div>
</template>
