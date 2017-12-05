const channels = require('./channels')
const Generator = require('./generator')

module.exports = class Listener {
  constructor (connection) {
    this.connection = connection
    this.id = Math.random()
    this.connection.lpush('listeners', this.id)
  }

  run () {
    this.connection.on('message', (channel, message) => {
      switch (channel) {
        case channels.messages:
          const eventHandler = (msg, callback) => {
            this._lastMessage = msg

            const onComplete = () => {
              var error = Math.random() > 1
              callback(error, msg)
            }
            setTimeout(onComplete, Math.floor(Math.random() * 1000))
          }

          eventHandler(message, (err, msg) => {
            if (err) this.connection.send_command('lpush', ['errorList', msg])
            else console.log('Completed message', msg)
          })
          break
        case channels.system:
          if (message === 'GENERATOR_DISCONNECTED') {
            this.unsubscribe()
            // Get first actual connection to let him
            this.connection.lindex('listeners', 0, (err, id) => {
              if (!err) {
                console.log('First worked connection is', id, ' and this is', this.id)
                if (this.id === Number(id)) {
                  this.connection.lpop('listeners', () => (new Generator(this.connection, this._lastMessage)).run())
                } else {
                  this.subscribe()
                }
              } else console.error(err)
            })
          }
          break
        default:
          console.error('Undefined channel.')
      }
    })

    this.subscribe()
  }

  unsubscribe () {
    this.connection.unsubscribe(channels.messages, channels.system)
  }

  subscribe () {
    this.connection.subscribe(channels.messages, channels.system)
  }
}
