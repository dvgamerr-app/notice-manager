module.exports = {
  onEvents: {
    'join': async (event) => {
      let { groupId } = event.source
      return groupId
    }
  },
  onCommands: {
    // args, event, client
    'id': async (args, event) => {
      let { userId, type, groupId, roomId } = event.source
      if (type === 'room') {
        return roomId
      } else if (type === 'group') {
        return groupId
      } else {
        return userId
      }
    }
  }
}
