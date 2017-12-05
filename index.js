const argv = require('minimist')(process.argv.slice(2))
const redis = require('redis')

if (argv['get-error']) {
  // TODO: console out all errors from redis and clean up database
}

const port = argv.port || 6379
const host = argv.host || '127.0.0.1'
const isGenerator = argv.generator
const errorList = 'errorList'
const channels = {
  system: 'system',
  messages: 'messages'
}

const client = redis.createClient({
  host,
  port
})

function generatorLogic () {
  let messageCount = 0

  const generate = () => {
    console.log('emit message:', messageCount)
    client.publish(channels.messages, messageCount++)
  }

  setInterval(generate, 500)
}

function observerLogic () {
  client.on('subscribe', (channel, message) => {
  })

  client.on('message', (channel, message) => {
    // TODO: receive message, simulate the work, and probably crash

    switch (channel) {
      case channels.messages:
        const eventHandler = (msg, callback) => {
          const onComplete = () => {
            var error = Math.random() > 0.85
            callback(error, msg)
          }
          // processing takes time...
          setTimeout(onComplete, Math.floor(Math.random() * 1000))
        }

        eventHandler(message, (err, msg) => {
          if (err) {
            client.unsubscribe(channels.messages, err => {
              if (!err) {
                client.send_command('lpush', [errorList, msg], (err, msg) => {
                  if (!err) {
                    client.subscribe(channels.messages)
                  }
                })
              }
            })
          }
        })
        break
      case channels.system:
        console.log('SYSTEM:', message)
        break
      default:
        console.error('Undefined channel.')
    }
  })

  client.subscribe(channels.messages)
}

if (isGenerator) generatorLogic()
else observerLogic()
