import helpFlex from './flex-help'
import { slackMessage } from '../helper'

import pkg from '../../package.json'
const pkgChannel = 'api-line-bot'
const pkgName = `LINE-BOT v${pkg.version}`

export default {
  onEvents: {
    'join': async (event) => {
      let sourceId = event.source[`${event.source.type}Id`]
      return sourceId
    },
    'leave': async (event) => {
      await slackMessage(pkgChannel, pkgName, `Bot your remove from \`${event.source.type}\`.`)
    }
  },
  onCommands: {
    'id': async (args, event) => {
      let sourceId = event.source[`${event.source.type}Id`]
      return sourceId
    },
    'help': async (args, event) => {
      if (event.source.type === 'user') return helpFlex
    },
    'api': async () => {
      return `https://intense-citadel-55702.herokuapp.com/documentation` 
    }
  }
}