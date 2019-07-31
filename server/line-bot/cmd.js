import helpFlex from './flex-help'
import { webhookMessage, pkgName } from '../helper'

export const onEvents = {
  'join': async (event) => {
    let sourceId = event.source[`${event.source.type}Id`]
    return sourceId
  },
  'leave': async (event) => {
    await webhookMessage('teams', 'line-notify', `${pkgName}<br>Bot your remove from \`${event.source.type}\`.`)
  }
}

export const onCommands = {
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