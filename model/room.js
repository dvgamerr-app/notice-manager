// User Model
import { Model } from '@vuex-orm/core'

export default class Room extends Model {
  static get entity() {
    return 'room'
  }

  // List of all fields (schema) of the post model. `this.attr` is used
  // for the generic field type. The argument is the default value.
  static fields () {
    return {
      _id: this.attr(null),
      name: this.attr(''),
      service: this.attr(''),
      room: this.attr(''),
    }
  }
}
