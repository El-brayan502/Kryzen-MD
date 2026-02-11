import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
  if (!args[0]) {
    return m.reply('📌 Usa: .tiktok <link>')
  }

  try {
    await m.react('⏳')

    const api = `https://neji-api.vercel.app/api/downloader/tiktok?url=${encodeURIComponent(args[0])}`
    const res = await fetch(api)
    const json = await res.json()

    if (!json.status) throw 'No se pudo descargar'

    const data = json.result
    const videoUrl = data.cover.play

    // ⬇️ Descargar video a buffer (FIX)
    const videoRes = await fetch(videoUrl)
    const buffer = Buffer.from(await videoRes.arrayBuffer())

    // 📩 Mensaje informativo
    await conn.sendMessage(
      m.chat,
      {
        text:
`🎵 *TikTok Downloader*

👤 Autor: ${data.author_info.nickname}
⏱ Duración: ${data.cover.duration}s
🎧 Música: ${data.music.title}

> Preparando tu descarga...`
      },
      { quoted: m }
    )

    // 🎬 Enviar video
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
    m.reply('❌ Error al procesar el TikTok')
  }
}

handler.help = ['tiktok <url>']
handler.tags = ['dl']
handler.command = ['tiktok', 'tt']

export default handler