// User Model
import { Model } from '@vuex-orm/core'

export default class Bot extends Model {
  static get entity() {
    return 'bot'
  }

  static fields () {
    return {
      _id: this.attr(null),
      name: this.attr(''),
      botname: this.attr(''),
      stats: this.attr({}),
    }
  }
}
