// welcome.js
export async function before(m, { conn }) {
  if (!m.isGroup) return
  if (!m.messageStubType || m.messageStubType !== 27) return

  const who = m.messageStubParameters[0]
  const taguser = `@${who.split('@')[0]}`
  const botname = 'Nagi Bot'

  const file = 'https://raw.githubusercontent.com/El-brayan502/img/upload/uploads/e97fef-1769474597244.jpg'

  const productMessage = {
    product: {
      productImage: { url: file },
      productId: 'welcome-catalog-001',
      title: `👋 Bienvenido a ${botname}`,
      description: '',
      currencyCode: 'USD',
      priceAmount1000: '0',
      retailerId: 1677,
      url: 'https://wa.me/0',
      productImageCount: 1
    },

    businessOwnerJid: '0@s.whatsapp.net',

    caption: `
✨ *Bienvenido/a al grupo* ✨

👤 Usuario: ${taguser}

📌 Para usar los comandos del bot
debes registrarte primero.

📝 Presiona el botón de abajo
para registrarte automáticamente.
`.trim(),

    footer: `© ${botname} · Welcome`,

    interactiveButtons: [
      {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: '📝 REGISTRARME',
          id: '.reg user.19'
        })
      }
    ],

    mentions: [who]
  }

  await conn.sendMessage(m.chat, productMessage)
}