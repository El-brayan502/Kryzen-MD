import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (!text) {
      return conn.reply(
        m.chat,
        `*☘️ Envíe un enlace de ${usedPrefix + command}, para hacer la descarga*`,
        m,
        rcanal
      )
    }

    await m.react('⏳')

    const api = `https://neji-api.vercel.app/api/downloader/tiktok?url=${encodeURIComponent(text)}`
    const res = await fetch(api)
    const json = await res.json()

    if (!json.status) {
      return conn.reply(m.chat, '❌ No se pudo descargar el TikTok', m, rcanal)
    }

    const data = json.result
    const videoUrl = data.cover.play

    await conn.reply(
      m.chat,
`🎵 *TikTok Downloader*

👤 Autor: ${data.author_info.nickname}
⏱ Duración: ${data.cover.duration}s
🎧 Música: ${data.music.title}

> Preparando tu descarga...`,
      m,
      rcanal
    )

    const videoRes = await fetch(videoUrl)
    const buffer = Buffer.from(await videoRes.arrayBuffer())

    await conn.sendMessage(
      m.chat,
      {
        video: buffer,
        mimetype: 'video/mp4',
        caption: data.title || 'TikTok'
      },
      { quoted: m }
    )

    await m.react('✅')

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, '❌ Error al procesar el TikTok', m, rcanal)
  }
}

handler.help = ['tiktok <url>']
handler.tags = ['dl']
handler.command = ['tiktok', 'tt']

export default handler