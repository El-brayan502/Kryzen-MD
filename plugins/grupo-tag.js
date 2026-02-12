import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, participants }) => {
  if (!m.quoted && !text)
    return conn.reply(
      m.chat,
      '⚠️ Debes escribir o responder a un mensaje para enviar el anuncio.',
      m
    )

  let users = participants.map(u => conn.decodeJid(u.id))
  let quoted = m.quoted ? m.quoted : m

  let anuncio = `
📢 *ANUNCIO DEL GRUPO*

${text ? text : 'Se ha emitido un aviso importante para todos los miembros.'}

────────────────────
_Administración_
`.trim()

  try {
    
    let msgType = m.quoted ? quoted.mtype : 'extendedTextMessage'
    let content = m.quoted
      ? quoted.message[msgType]
      : { text: anuncio }

    let msg = conn.cMod(
      m.chat,
      generateWAMessageFromContent(
        m.chat,
        { [msgType]: content },
        { quoted: null, userJid: conn.user.id }
      ),
      anuncio,
      conn.user.jid,
      { mentions: users }
    )

    await conn.relayMessage(m.chat, msg.message, {
      messageId: msg.key.id
    })
  } catch (e) {
    console.log('Fallback activado:', e)

    let mime = (quoted.msg || quoted).mimetype || ''
    let isMedia = /image|video|audio|sticker/.test(mime)

    if (isMedia) {
      let media = await quoted.download?.()

      if (quoted.mtype === 'imageMessage') {
        await conn.sendMessage(
          m.chat,
          { image: media, caption: anuncio, mentions: users },
          { quoted: null }
        )
      } else if (quoted.mtype === 'videoMessage') {
        await conn.sendMessage(
          m.chat,
          { video: media, caption: anuncio, mentions: users },
          { quoted: null }
        )
      } else if (quoted.mtype === 'audioMessage') {
        await conn.sendMessage(
          m.chat,
          {
            audio: media,
            mimetype: 'audio/mp4',
            fileName: 'Anuncio.mp3',
            mentions: users
          },
          { quoted: null }
        )
      } else if (quoted.mtype === 'stickerMessage') {
        await conn.sendMessage(
          m.chat,
          { sticker: media, mentions: users },
          { quoted: null }
        )
      }
    } else {
     
      await conn.sendMessage(
        m.chat,
        { text: anuncio, mentions: users },
        { quoted: null }
      )
    }
  }
}

handler.help = ['hidetag', 'anuncio']
handler.tags = ['group']
handler.command = ['hidetag', 'notificar', 'notify', 'tag', 'anuncio']
handler.group = true
handler.admin = true

export default handler