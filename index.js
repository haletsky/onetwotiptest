const argv = require('minimist')(process.argv.slice(2))
const redis = require('redis')

const port = argv.port || 6379
const host = argv.host || '127.0.0.1'
const isGenerator = argv.generator
const errorList = 'errorList'
let messageCounter = 0
const channels = {
  system: 'system',
  messages: 'messages'
}

const publisher = redis.createClient({
  host,
  port
})
const subscriber = redis.createClient({
  host,
  port
})

if (argv['get-errors']) {
  // Get errors, delete them and quit
  publisher.lrange(errorList, 0, -1, (err, list) => {
    if (!err) console.log(list)
    else console.error(err)
    publisher.del(errorList, err => {
      if (!err) {
        publisher.quit()
        process.exit(0)
      } else console.log(err)
    })
  })
} else {
  function generatorLogic () {
    // Handle "crashes"
    process.on('SIGINT', () => publisher.publish(channels.system, 'disconect', process.exit))

    const generate = () => {
      console.log('emit message:', messageCounter)
      publisher.publish(channels.messages, messageCounter++)
    }

    setInterval(generate, 500)
  }

  function observerLogic () {
    subscriber.on('message', (channel, message) => {
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
              publisher.send_command('lpush', [errorList, msg])
            }
          })
          break
        case channels.system:
          // TODO: unsub -> get uuid of current generator -> if nil put own uuid -> become an generator -> check that uuid is equal with redis -> start emitting messages
          publisher.exists('generator-id', (err, id) => {
            if (!err && !id) {
              publisher.set('generator-id', Math.random(), () => subscriber.quit(() => generatorLogic()))
            } else console.error('something goes wrong', err, id)
          })
          break
        default:
          console.error('Undefined channel.')
      }
    })

    subscriber.subscribe(channels.messages, channels.system)
  }

  if (isGenerator) generatorLogic()
  else observerLogic()
}
