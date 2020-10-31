// User Model
import { Model } from '@vuex-orm/core'
// import Room from './room'

export default class Notify extends Model {
  static get entity () {
    return 'notify'
  }

  static get primaryKey () {
    return '_id'
  }

  static fields () {
    return {
      _id: this.attr(null),
      text: this.attr(''),
      value: this.attr(''),
      room: this.attr([])
    }
  }
}
