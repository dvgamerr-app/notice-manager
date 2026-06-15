const mintify = (text) =>
  text.includes('hrs') ? text.replace(/ hr(|s) /gi, ':').replace(/min(|s)/gi, 'hr') : text

export default (data) => {
  if (!data.length) return 'ไม่มีข้อมูลผู้เข้าร่วมจัดอันดับ ครับผม!!'
  data = [...data].sort((a, b) => b.stats.total_seconds - a.stats.total_seconds)

  const rows = data.map((row, i) => ({
    type: 'box', layout: 'horizontal', spacing: '0px',
    contents: [
      {
        type: 'box', layout: 'baseline', width: '18px',
        offsetTop: i <= 2 ? '1px' : '0px',
        contents: [{
          type: 'text',
          text: `${i <= 2 ? '#' : ''}${i + 1}`,
          size: i <= 2 ? 'md' : 'sm', weight: 'bold', flex: 1, align: 'end',
          color: i === 0 ? '#FFDE4D' : i === 1 ? '#E6E4F1' : i === 2 ? '#B5938A' : '#000000'
        }]
      },
      {
        type: 'box', layout: 'horizontal', cornerRadius: '16px',
        offsetTop: '3px', offsetEnd: '3px', flex: 1, height: '16px', width: '16px', margin: 'lg',
        contents: [{ type: 'image', url: row.user.photo }]
      },
      {
        type: 'text', text: row.user.display_name || '',
        weight: i <= 2 ? 'bold' : 'regular', gravity: 'bottom', size: 'sm', flex: 6, margin: 'xs', color: '#337AB7',
        action: row.user.username ? { type: 'uri', label: 'action', uri: `https://wakatime.com/@${row.user.username}` } : undefined
      },
      { type: 'text', text: mintify(row.stats.human_readable_total), gravity: 'bottom', size: 'xs', flex: 3, margin: 'sm' },
      { type: 'text', text: mintify(row.stats.human_readable_daily_average), gravity: 'bottom', size: 'xs', flex: 3, margin: 'sm' },
      { type: 'text', text: row.stats.languages.map(l => l.name).join() || 'N/A', gravity: 'bottom', size: 'xs', color: '#ababab', flex: 5, margin: 'sm' }
    ]
  }))

  return {
    type: 'flex', altText: 'Leaderboard TEAM',
    contents: {
      type: 'bubble', size: 'giga',
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        paddingBottom: '5px', paddingTop: '10px', paddingStart: '15px', paddingEnd: '15px',
        contents: [
          {
            type: 'box', layout: 'vertical',
            contents: [
              { type: 'text', text: 'TEAM Ranking', size: 'md', weight: 'bold' },
              { type: 'text', text: 'Leaderboards', size: 'xxs', offsetTop: '-3px', color: '#C3C3C3' },
              { type: 'image', url: 'https://wakatime.com/static/img/wakatime.svg', gravity: 'top', aspectMode: 'fit', aspectRatio: '1:1', size: '25px', position: 'absolute', offsetEnd: '10px', offsetTop: '5px' }
            ]
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box', layout: 'horizontal', spacing: '0px',
            contents: [
              { type: 'box', layout: 'horizontal', contents: [], width: '18px' },
              { type: 'box', layout: 'horizontal', contents: [], width: '16px', margin: 'lg', height: '16px' },
              { type: 'text', text: 'Programmer', size: 'sm', weight: 'bold', flex: 6, margin: 'xs', offsetStart: '-22px' },
              { type: 'text', text: 'Hours', size: 'sm', weight: 'bold', flex: 3, margin: 'sm' },
              { type: 'text', text: 'Daily avg', size: 'sm', weight: 'bold', flex: 3, margin: 'sm' },
              { type: 'text', text: 'Languages', size: 'sm', weight: 'bold', flex: 5, margin: 'sm' }
            ]
          },
          ...rows,
          {
            type: 'box', layout: 'baseline', spacing: 'sm', margin: 'md',
            contents: [{ type: 'text', text: 'Power by wakatime.com', size: 'xxs', color: '#bcbcbc', align: 'end' }]
          }
        ]
      }
    }
  }
}
