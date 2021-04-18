const mintify = (text) => {
  return text.includes('hrs') ? text.replace(/ hr(|s) /ig, ':').replace(/min(|s)/ig, 'hr') : text
}

module.exports = (e, data) => {
  if (!data.length) { return 'ไม่มีข้อมูล ผู้เข้าร่วมจัดอันดับ ครับผม!!' }
  data = data.sort((a, b) => a.stats.total_seconds <= b.stats.total_seconds ? 1 : -1)
  const contents = [
    {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: 'Ranking', size: 'md', weight: 'bold' },
        { type: 'text', text: 'Leaderboards', size: 'xxs', offsetTop: '-3px', color: '#C3C3C3' },
        { type: 'image', url: 'https://wakatime.com/static/img/wakatime.svg', gravity: 'top', aspectMode: 'fit', aspectRatio: '1:1', size: '25px', position: 'absolute', offsetEnd: '10px', offsetTop: '5px' }
      ]
    },
    { type: 'separator', margin: 'md' },
    {
      type: 'box',
      layout: 'horizontal',
      contents: [
        { type: 'box', layout: 'horizontal', contents: [], width: '18px' },
        { type: 'box', layout: 'horizontal', contents: [], width: '16px', margin: 'lg', height: '16px' },
        { type: 'text', text: 'Programmer', size: 'sm', weight: 'bold', flex: 6, margin: 'xs', offsetStart: '-22px' },
        { type: 'text', text: 'Hours', size: 'sm', weight: 'bold', flex: 3, margin: 'sm' },
        { type: 'text', text: 'Daily avg', size: 'sm', weight: 'bold', flex: 3, margin: 'sm' },
        { type: 'text', text: 'Languages', size: 'sm', weight: 'bold', flex: 5, margin: 'sm' }
      ],
      spacing: '0px'
    }
  ]

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    contents.push({
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [{
            type: 'text',
            text: `${i <= 2 ? '#' : ''}${i + 1}`,
            size: i <= 2 ? 'md' : 'sm',
            weight: 'bold',
            flex: 1,
            align: 'end',
            color: i === 0 ? '#FFDE4D' : i === 1 ? '#E6E4F1' : i === 2 ? '#B5938A' : '#000000'
          }],
          width: '18px',
          offsetTop: i <= 2 ? '1px' : '0px'
        },
        {
          type: 'box',
          layout: 'horizontal',
          contents: [{ type: 'image', url: row.user.photo }],
          cornerRadius: '16px',
          offsetTop: '3px',
          offsetEnd: '3px',
          flex: 1,
          height: '16px',
          width: '16px',
          margin: 'lg'
        },
        {
          type: 'text',
          text: row.user.display_name,
          weight: i <= 2 ? 'bold' : 'regular',
          gravity: 'bottom',
          size: 'sm',
          flex: 6,
          margin: 'xs',
          color: '#337AB7',
          action: {
            type: 'uri',
            label: 'action',
            uri: `https://wakatime.com/@${row.user.username}`
          }
        },
        {
          type: 'text',
          text: mintify(row.stats.human_readable_total),
          gravity: 'bottom',
          size: 'xs',
          flex: 3,
          margin: 'sm'
        },
        {
          type: 'text',
          text: mintify(row.stats.human_readable_daily_average),
          gravity: 'bottom',
          size: 'xs',
          flex: 3,
          margin: 'sm'
        },
        {
          type: 'text',
          text: row.stats.languages.map(l => l.name).join(),
          gravity: 'bottom',
          size: 'xs',
          color: '#ababab',
          flex: 5,
          margin: 'sm'
        }
      ],
      spacing: '0px'
    })
  }
  contents.push({
    type: 'box',
    layout: 'baseline',
    contents: [
      { type: 'text', text: 'Power by wakatime.com', size: 'xxs', color: '#bcbcbc', align: 'end' }
    ],
    spacing: 'sm',
    margin: 'md'
  })

  return {
    type: 'flex',
    altText: 'Leaderboard at RIS',
    contents: {
      type: 'bubble',
      size: 'giga',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents,
        paddingBottom: '5px',
        paddingTop: '10px',
        paddingStart: '15px',
        paddingEnd: '15px'
      }
    }
  }
}
