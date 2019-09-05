// User Model
import { Model } from '@vuex-orm/core'

export default class User extends Model {
  static get entity() {
    return 'users'
  }

  // List of all fields (schema) of the post model. `this.attr` is used
  // for the generic field type. The argument is the default value.
  static fields () {
    return {
      id: this.attr(null),
      name: this.attr(''),
      email: this.attr('')
    }
  }
}
