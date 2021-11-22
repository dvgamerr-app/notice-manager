// User Model
import { Model } from '@vuex-orm/core'
import Notiroom from './notiRoom'

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
      type: this.attr(''),
      service: this.attr(''),
      room: this.hasMany(Notiroom, 'service', 'value'),
      removed: this.boolean(false)
    }
  }
}
