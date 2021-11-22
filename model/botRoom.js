import { Model } from '@vuex-orm/core'

export default class Botroom extends Model {
  static get entity () {
    return 'botroom'
  }

  static get primaryKey () {
    return ['botname', 'name']
  }

  static fields () {
    return {
      botname: this.attr(null),
      name: this.attr(null),
      removed: this.boolean(false)
    }
  }
}
