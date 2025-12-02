require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')

// ===== SET TOKEN =====
const TOKEN = process.env.BOT_TOKEN
if (!TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env')
  process.exit(1)
}

// ===== START BOT =====
const bot = new TelegramBot(TOKEN, { polling: true })
console.log('🤖 XNG Telegram Bot sedang berjalan...')

const prefixes = ['.', '/']

// ===== AUTO LOAD COMMANDS =====
const commands = new Map()

fs.readdirSync('./commands').forEach(file => {
  if (file.endsWith('.js')) {
    const cmd = require(`./commands/${file}`)
    commands.set(cmd.name, cmd)
    if (cmd.aliases) cmd.aliases.forEach(a => commands.set(a, cmd))
    console.log(`📦 Loaded Command: ${cmd.name}`)
  }
})

// ===== WELCOME MESSAGE =====
bot.on('new_chat_members', async (msg) => {
  const chatId = msg.chat.id
  for (const member of msg.new_chat_members) {
    const mention = member.username
      ? `@${member.username}`
      : `[klik di sini](tg://user?id=${member.id})`
    await bot.sendMessage(chatId,
      `🎉 Selamat datang ${mention} di grup *${msg.chat.title}*!`,
      { parse_mode: 'Markdown' }
    )
  }
})

// ===== COMMAND HANDLER =====
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text || msg.caption || ''

  // cek prefix
  const prefix = prefixes.find(p => text.startsWith(p))
  if (!prefix) return

  const args = text.slice(prefix.length).trim().split(/\s+/)
  let cmdName = args.shift()?.toLowerCase()

  // hapus @botname
  if (cmdName.includes('@')) cmdName = cmdName.split('@')[0]

  const cmd = commands.get(cmdName)
  if (!cmd) return

  console.log(`⚙️ Command: ${cmdName} | From: ${msg.from?.username}`)

  try {
    await cmd.run(bot, msg, args)
  } catch (err) {
    console.error(`❌ Error in command ${cmdName}:`, err)
    bot.sendMessage(chatId, '⚠️ Error executing command.')
  }
})

// ===== SAFE STOP =====
process.on('SIGINT', () => {
  console.log('🛑 Bot stopped.')
  bot.stopPolling()
  process.exit(0)
})
