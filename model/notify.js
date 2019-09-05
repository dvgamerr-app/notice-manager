// User Model
import { Model } from '@vuex-orm/core'
// import Room from './room'

export default class Notify extends Model {
  static get entity() {
    return 'notify'
  }

  static fields () {
    return {
      _id: this.attr(null),
      name: this.attr(''),
      service: this.attr(''),
      room: this.attr([])
    }
  }
}
