import { Model } from '@vuex-orm/core'
import Botroom from './botRoom'

export default class Bot extends Model {
  static get entity () {
    return 'bot'
  }

  static get primaryKey () {
    return ['value']
  }

  static fields () {
    return {
      text: this.attr(''),
      value: this.attr(null),
      type: this.attr(''),
      stats: this.attr({}),
      room: this.hasMany(Botroom, 'botname', 'value'),
      wait: this.boolean(false),
      removed: this.boolean(false)
    }
  }
}
