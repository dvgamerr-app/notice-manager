<template>
  <b-row>
    <b-col class="pt-5">
      <h3>Dashboard</h3>
      <hr>
      <b-row class="mb-5">
        <b-col md="3">
          a
        </b-col>
        <b-col md="3">
          b
        </b-col>
        <b-col md="3">
          c
        </b-col>
        <b-col md="3">
          d
        </b-col>
      </b-row>
      
      <div v-for="e in service" :key="e._id">
        <h5 v-text="e.name" />
        <hr>
        <ul>
          <li v-for="r in e.room" :key="r._id">
            {{ r.room }}
          </li>
        </ul>
      </div>
    </b-col>
  </b-row>
</template>

<script>

export default {
  data: () => ({
    service: []
  }),
  async asyncData ({ $axios }) {
    let uri = '/api/dashboard'
    let { data, status, statusText } = await $axios(uri)
    if (status !== 200) throw new Error(`Server Down '${uri}' is ${statusText}.`)
    return {
      service: data
    }
  }
}
</script>
