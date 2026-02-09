import yts from 'yt-search'

// Handler play
let handler = async (m, { conn, args }) => {
  if (!args.length) {
    return m.reply('🎵 *Usa:* .play nombre de la canción')
  }

  try {
    await m.react('🔎')

    const query = args.join(' ')
    const search = await yts(query)

    if (!search.videos.length) {
      return m.reply('❌ No se encontraron resultados')
    }

    const video = search.videos[0]

    const title = video.title
    const canal = video.author.name
    const timestamp = video.timestamp
    const vistas = video.views.toLocaleString()
    const thumb = video.thumbnail

    // 📸 MENSAJE CON IMAGEN + INFO
    await conn.sendMessage(
      m.chat,
      {
        image: { url: thumb },
        caption:
`*°${title}*
Canal : ${canal}
Duración : ${timestamp}
Vistas : ${vistas}

> Preparando tu descarga...`
      },
      { quoted: m }
    )

    await m.react('🕓')

    // 🎧 DESCARGA AUDIO
    const { buffer, fileName } = await yt.download(video.url, '128k')

    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName
      },
      { quoted: m }
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    m.reply('❌ Error al reproducir la canción')
  }
}

handler.help = ['play <texto>']
handler.tags = ['music']
handler.command = ['play', 'p']

export default handler