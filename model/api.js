/*eslint-disable */

import { Model } from '@vuex-orm/core'

export default class Api extends Model {
  static get entity() {
    return 'api'
  }

  // `this.belongsTo` is for the belongs to relationship.
  static fields () {
    return {
      id: this.attr(null),
      hostname: this.attr(''),
      proxyname: this.attr('')
    }
  }
}