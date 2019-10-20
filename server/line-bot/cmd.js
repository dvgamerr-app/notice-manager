import helpFlex from './flex-help'
import { notifyLogs } from '../helper'

export const onEvents = {
  'join': async (event) => {
    let sourceId = event.source[`${event.source.type}Id`]
    await notifyLogs(`Bot your join in ${event.source.type} (${sourceId}).`)
    return sourceId
  },
  'leave': async (event) => {
    let sourceId = event.source[`${event.source.type}Id`]
    await notifyLogs(`Bot your leave from ${event.source.type} (${sourceId}).`)
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