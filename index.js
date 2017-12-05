const argv = require('minimist')(process.argv.slice(2))
const redis = require('redis')

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

if (argv['get-errors']) {
  client.lrange(errorList, 0, -1, (err, list) => {
    if (!err) console.log(list)
    else console.error(err)
    client.del(errorList, err => {
      if (!err) {
        client.quit()
        process.exit(0)
      } else console.log(err)
    })
  })
} else {
  function generatorLogic () {
    let messageCount = 0

    // Handle "crashes"
    process.on('SIGINT', () => client.publish(channels.system, 'disconect', process.exit))

    const generate = () => {
      console.log('emit message:', messageCount)
      client.publish(channels.messages, messageCount++)
    }

    setInterval(generate, 500)
  }

  function observerLogic () {
    client.on('message', (channel, message) => {
      console.log(channel, message)
      switch (channel) {
        case channels.messages:
          const eventHandler = (msg, callback) => {
            const onComplete = () => {
              var error = Math.random() > 0.85
              callback(error, msg)
            }
            setTimeout(onComplete, Math.floor(Math.random() * 1000))
          }

          eventHandler(message, (err, msg) => {
            if (err) {
              // I don't know how to run LPUSH command while client are subscribed (documentation said, that you can't run anything but some pub\sub commands).
              // So, I need do unsub, and then sub again.
              client.unsubscribe(channels.messages, channels.system, err => {
                if (!err) {
                  client.send_command('lpush', [errorList, msg], err => {
                    if (!err) {
                      client.subscribe(channels.messages, channels.system)
                    } else console.error('senc_command ERROR:', err)
                  })
                } else console.error('Unsubscribe ERROR:', err)
              })
            }
          })
          break
        case channels.system:
          break
        default:
          console.error('Undefined channel.')
      }
    })

    client.subscribe(channels.messages, channels.system)
  }

  if (isGenerator) generatorLogic()
  else observerLogic()
}
