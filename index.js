/**
 * NAGI BOT - BOT CORE
 * Refactored for greater readability and order. 
 */

import './settings.js'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import path, { join, dirname } from 'path'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import { format } from 'util'
import { spawn } from 'child_process'

// Third-Party Bookstores 
import cfonts from 'cfonts'
import chalk from 'chalk'
import yargs from 'yargs'
import lodash from 'lodash'
import pino from 'pino'
import { Boom } from '@hapi/boom'
import NodeCache from 'node-cache'
import syntaxerror from 'syntax-error'
import readline from 'readline'
import { Low, JSONFile } from 'lowdb'

// Baileys & WhatsApp Core 
import * as ws from 'ws'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import store from './lib/store.js'
import pkg from 'google-libphonenumber'

const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser 
} = (await import('@whiskeysockets/baileys')).default

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
const { say } = cfonts
const { chain } = lodash
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

protoType()
serialize()

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') => 
    rmPrefix ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true))
global.__require = (dir = import.meta.url) => createRequire(dir)

const __dirname = global.__dirname(import.meta.url)
global.timestamp = { start: new Date() }
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./-]')

console.log(chalk.magentaBright('\n𝙸𝚗𝚒𝚌𝚒𝚊𝚗𝚍𝚘 𝙴𝚜𝚙𝚎𝚛𝚎'))
say('Kryzen-MD', { font: 'block', align: 'left', gradient: ['green', 'white'] })
say('Created by Brayan330', { font: 'console', align: 'center', colors: ['cyan', 'magenta', 'yellow'] })

global.db = new Low(/https?:\/\//.test(global.opts['db'] || '') ? new cloudDBAdapter(global.opts['db']) : new JSONFile('database.json'))
global.DATABASE = global.db
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return new Promise((resolve) => setInterval(function () {
        if (!global.db.READ) { clearInterval(this); resolve(global.db.data == null ? global.loadDatabase() : global.db.data) }
    }, 1000))
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = { users: {}, chats: {}, settings: {}, ...(global.db.data || {}) }
    global.db.chain = chain(global.db.data)
}
loadDatabase()

const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
const { version } = await fetchLatestBaileysVersion()
const msgRetryCounterCache = new NodeCache()
const userDevicesCache = new NodeCache()

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // It is dynamically handled below 
    browser: ["MacOs", "Safari"],
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        } catch { return "" }
    },
    msgRetryCounterCache,
    userDevicesCache,
    version,
    keepAliveIntervalMs: 55000
}

global.conn = makeWASocket(connectionOptions)
conn.ev.on("creds.update", saveCreds)

if (!fs.existsSync(`./${global.sessions}/creds.json`)) {
    let methodCodeQR = process.argv.includes("qr")
    let methodCode = !!global.botNumber || process.argv.includes("code")
    let opcion = methodCodeQR ? '1' : (methodCode ? '2' : '')

    if (!opcion) {
        console.log(chalk.bold.white("\nSeleccione una opción:"));
        console.log(chalk.yellowBright("1. Con código QR"));
        console.log(chalk.yellowBright("2. Con código de texto (8 dígitos)"));
        opcion = await question(chalk.magentaBright("--> "));
    }

    if (opcion === '1') {
        conn.printQRInTerminal = true 
    } else if (opcion === '2') {
        let phoneNumber = global.botNumber || await question(chalk.bgBlack(chalk.bold.greenBright(`\n「 🔷️ 」 Ingrese el número (Ej: 50231458537):\n---> `)))
        phoneNumber = phoneNumber.replace(/\D/g, '')
        
        setTimeout(async () => {
            let codeBot = await conn.requestPairingCode(phoneNumber)
            codeBot = codeBot.match(/.{1,4}/g)?.join("-") || codeBot
            console.log(chalk.bold.white(chalk.bgMagenta(`\n「 🟢 」CÓDIGO DE VINCULACIÓN:`)), chalk.bold.white(codeBot))
        }, 3000)
    }
}


async function connectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update
    if (qr) console.log(chalk.yellow(`「 ⬆️ 」Escanea el código QR mostrado arriba.`))
    
    if (connection === "open") {
        console.log(chalk.yellow(`\n「 ✅️ 」CONEXIÓN EXITOSA DE NAGI | ${conn.user.name}`))
        await joinChannels(this)
    }

    if (connection === "close") {
        let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
        console.log(chalk.red(`\n「 ❗ 」SE CERRO LA CONEXIÓN VUELVA AH CONECATARCE `))
        await global.reloadHandler(true)
    }
}

let handler = await import('./handler.js')
global.reloadHandler = async function (restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`)
        if (Object.keys(Handler || {}).length) handler = Handler
    } catch (e) { console.error(e) }

    if (restatConn) {
        try { global.conn.ws.close() } catch { }
        conn.ev.removeAllListeners()
        global.conn = makeWASocket(connectionOptions)
    }

    conn.handler = handler.handler.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)

    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)
    return true
}

const pluginFolder = join(__dirname, './plugins')
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = global.__filename(join(pluginFolder, filename))
            const module = await import(file)
            global.plugins[filename] = module.default || module
        } catch (e) { console.error(`Error cargando plugin ${filename}:`, e) }
    }
}

global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        const dir = global.__filename(join(pluginFolder, filename), true)
        if (existsSync(dir)) {
            try {
                const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
                global.plugins[filename] = module.default || module
                console.log(chalk.cyan(`[INFO] Plugin actualizado: ${filename}`))
            } catch (e) { console.error(`Error en syntax de plugin: ${filename}`) }
        }
    }
}
watch(pluginFolder, global.reload)

setInterval(() => {
    const tmpDir = join(__dirname, 'tmp')
    if (existsSync(tmpDir)) {
        readdirSync(tmpDir).forEach(file => unlinkSync(join(tmpDir, file)))
        console.log(chalk.gray(`✅️ Carpeta TMP limpia.`))
    }
}, 30 * 1000)

setInterval(async () => {
    if (global.db.data) await global.db.write()
}, 30 * 1000)

filesInit().then(() => console.log(chalk.greenBright(`「 🔄 」Plugins cargados.`)))
await global.reloadHandler()
console.log(chalk.bold.cyan(`\n「 ✅️ 」SISTEMA LISTO\n`))

async function isValidPhoneNumber(number) {
    try {
        const parsedNumber = phoneUtil.parseAndKeepRawInput(number.startsWith('+') ? number : `+${number}`)
        return phoneUtil.isValidNumber(parsedNumber)
    } catch { return false }
}

async function joinChannels(sock) {
    for (const value of Object.values(global.ch || {})) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            await sock.newsletterFollow(value).catch(() => {})
        }
    }
}

process.on('uncaughtException', console.error)
process.on('unhandledRejection', (reason) => console.error("Rechazo no manejado:", reason))