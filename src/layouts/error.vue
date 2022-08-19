<template>
  <div class="error" code="404" />
</template>
<script>
export default {
  props: ['error']
}
</script>
<style>
.error::before {
  content: '404';
  color: #cecece;
  font-size: 10rem;
  position: absolute;
  left: calc(50vw - 8rem);
  top: calc(50vh - 8rem);
}
</style>
