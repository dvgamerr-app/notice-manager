import { Model } from '@vuex-orm/core'

export default class Notiroom extends Model {
  static get entity () {
    return 'notiroom'
  }

  static get primaryKey () {
    return ['notiname', 'name']
  }

  static fields () {
    return {
      service: this.attr(null),
      name: this.attr(null),
      removed: this.boolean(false)
    }
  }
}
