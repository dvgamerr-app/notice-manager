<template>
  <div class="error" code="404" />
</template>
<script>
export default {
  props: ['error']
}
</script>
<style>
.error {
  height: calc(100vh - 9.84em);

}
.error::before {
  content: "404";
  color: #cecece;
  font-size: 10rem;
  margin-left: 40%;
}
</style>
