// User Model
import { Model } from '@vuex-orm/core'

export default class Webhook extends Model {
  static get entity () {
    return 'webhook'
  }

  // List of all fields (schema) of the post model. `this.attr` is used
  // for the generic field type. The argument is the default value.
  static fields () {
    return {
      _id: this.attr(null),
      botname: this.attr(''),
      name: this.attr(''),
      type: this.attr('')
    }
  }
}
