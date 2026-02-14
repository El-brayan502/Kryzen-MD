import os from "node:os"
import fs from "node:fs"
import path from "path"
import {
  fileURLToPath
} from "url"

/* ================= CONFIG ================= */
const BOT_JID = "13135550002@s.whatsapp.net"
const MENU_THUMB = "./media/thumbnail.jpg"
const thumbjpg = "./media/thumbnail.jpg"
const YahBete = "./src/gokil.js"
const hadeh = "./media/image_icon.jpg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* ================= Font ================= */
const Font = (text = "") => {
  const map = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ꜰ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "ꜱ",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ"
  }
  return text.toLowerCase().split("").map(v => map[v] || v).join("")
}

/* ================= PACKAGE ================= */
const pkgPath = path.join(__dirname, "..", "..", "package.json")
let pkg = {}
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
} catch {}

const PKG = {
  name: pkg.name || "Unknown",
  version: pkg.version || "0.0.0",
  author: typeof pkg.author === "string" ? pkg.author : pkg.author?.name || "-"
}

/* ================= REACT ================= */
const react = async (schnee, m, emoji = "😝") =>
  schnee.sendMessage(m.chat, {
    react: {
      text: emoji,
      key: m.key
    }
  })

/* ================= HANDLER ================= */
let handler = async (m, {
  schnee,
  text = "",
  isROwner,
  usedPrefix
}) => {
  const botname = global.botname || "mtbot"

  const Mekik = fs.readFileSync(hadeh)
  const fkontak = {
    key: {
      participant: BOT_JID,
      fromMe: false,
      id: m.key?.id || "StatusBiz",
      remoteJid: "status@broadcast"
    },
    message: {
      imageMessage: {
        mimetype: "image/jpeg",
        caption: botname,
        jpegThumbnail: Mekik
      }
    }
  }

  let emoji = "😝"
  if (text === "all") emoji = "🤓"
  else if (text === "list") emoji = "😂"
  else if (text) emoji = "😬"
  await react(schnee, m, emoji)

  /* ================= PLUGINS ================= */
  const plugins = Object.values(global.pg.plugins || {}).filter(p => {
    if (!p || p.disabled || !p.help || !p.tags || p === handler) return false
    if (!isROwner && p.tags.includes("owner")) return false
    return true
  })

  const normalizeCmd = cmd =>
    cmd.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/gi, "")

  const buildMenu = (filterTags = []) => {
    const map = {}
    const selected = filterTags.map(v => v.toLowerCase())

    for (const p of plugins) {
      const tags = Array.isArray(p.tags) ? p.tags : [p.tags]
      const helps = Array.isArray(p.help) ? p.help : [p.help]
      const cmd = normalizeCmd(helps[0])
      if (!cmd) continue

      for (const tag of tags) {
        if (selected.length && !selected.includes(tag.toLowerCase())) continue
        map[tag] ??= []
        if (!map[tag].includes(cmd)) map[tag].push(cmd)
      }
    }

    return Object.entries(map).map(([tag, cmds]) => `
\`${Font("Menu")} ${Font(tag)}\`
${cmds.sort().map(v => `${usedPrefix}${Font(v)}`).join("\n")}
`).join("\n")
  }

  /* ================= OUTPUT ================= */
  let output = `
${Font("info bot")}
${Font("bot")}      : ${Font(PKG.name)}
${Font("version")}  : v${PKG.version}
${Font("author")}   : ${Font(PKG.author)}

${Font("notice")}
! ${Font("jangan spam command")}
! ${Font("bot masih tahap pengembangan")}
! ${Font("fitur belum sempurna")}
`.trim() + "\n\n"

  if (text === "all") {
    output += buildMenu()
  } else if (text === "list") {
    const tags = [...new Set(plugins.flatMap(p => p.tags))]
    output += `
${Font("menu tag")}
${tags.map(v => Font(v)).join("\n")}
`
  } else if (text) {
    output += buildMenu(text.split(/\s+/))
  } else {
    output += `
${Font("example")}
${usedPrefix}${Font("menu all")}
${usedPrefix}${Font("menu list")}
${usedPrefix}${Font("menu <tag>")}
`
  }

  await menuBut(m, schnee, output, [m.sender], fkontak)
}

const menuBut = async (m, schnee, text, mentions = [], fkontak, options = {}) => {
  const thumb = fs.readFileSync(MENU_THUMB)
  const menujink = fs.readFileSync(thumbjpg)
  const filekeren = fs.readFileSync(YahBete)

  await schnee.sendMessage(
    m.chat, {
      document: filekeren,
      fileName: `~ ${botname}`,
      mimetype: "image/png",
      fileLength: 9299288292,
      caption: text,
      jpegThumbnail: thumb,
      contextInfo: {
        mentionedJid: mentions,
        externalAdReply: {
          title: Font("menu"),
          body: Font("information"),
          thumbnail: menujink,
          sourceUrl: '𝑲𝒂𝒊𝒔𝒂𝒓 𝑹𝒂𝒇𝒛𝑽𝒆𝒍𝒍𝑵𝒔',
          mediaType: 1,
          renderLargerThumbnail: true
        },
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
          newsletterJid: global.saluran,
          newsletterName: "RafzVellNs || Information",
          serverMessageId: -1
        }
      },
      ...options
    }, {
      quoted: fkontak
    }
  )
}

handler.help = ["menu"]
handler.tags = ["info"]
handler.command = ["menu", "vell"]
handler.register = true

export default handler