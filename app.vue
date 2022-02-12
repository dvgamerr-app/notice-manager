<template>
  <div>
    <h3>Welcome NuxtPage</h3>
    <!-- <NuxtPage /> -->
  </div>
</template>
<script setup>
// export default {
//   transition: 'fade',
//   data: () => ({
//   }),
//   computed: {
//     profile () {
//       return this.$store.state.profile
//     }
//   },
//   methods: {
//     // loggedIn () {
//     //   return this.$liff.isLoggedIn()
//     // }
//   }
// }
</script>

<style lang="scss">

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
