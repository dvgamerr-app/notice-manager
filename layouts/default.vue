<template>
  <div>
    <header>
      <b-navbar type="dark" variant="dark">
        <b-container>
          <b-navbar-brand href="/">LINE Notify</b-navbar-brand>
          <b-nav-form>
            <b-form-input class="mr-sm-2" placeholder="Search"></b-form-input>
          </b-nav-form>
        </b-container>
      </b-navbar>
    </header>
    <b-container>
      <nuxt />
    </b-container>
    <footer>
      <b-container>
        <p>Copyright © 2019 Touno™, all rights reserved ∙ Design By <a href="https://mr.touno.io/" target="_blank">Kananek T.</a></p>
      </b-container>
    </footer>

  </div>
</template>

<style>
footer a, footer a:hover {
  color: #16c464;
}

footer p {
  padding: 15px 0;
  margin: 0px;
  font-size: .8rem;
}
</style>
