const argv = require('minimist')(process.argv.slice(2))
const redis = require('redis')

if (argv['get-error']) {
  // TODO: console out all errors from redis and clean up database
}

const port = argv.port || 6379
const host = argv.host || '127.0.0.1'
const isGenerator = argv.generator
const channel = 'getMessages'

const client = redis.createClient({
  host,
  port
})

function generatorLogic () {
  let messageCount = 0
  setInterval(() => client.publish(channel, messageCount++), 500)
}

function observerLogic () {
  client.on('subscribe', (channel, message) => {
  })

  client.on('message', (channel, message) => {
    // TODO: receive message, simulate the work, and probably crash
    console.log(channel, message)
  })

  client.subscribe(channel)
}

if (isGenerator) generatorLogic()
else observerLogic()
