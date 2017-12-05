const channels = require('./channels')
const Generator = require('./generator')

module.exports = class Listener {
  constructor (connection) {
    this.connection = connection
    this.id = Math.random()
    this.connection.lpush('listeners', this.id)
  }

  run () {
    const eventHandler = (c, message) => {
      if (message === 'GENERATOR_DISCONNECTED') { // We need to get first listener in stack and let him become generator
        this.unsubscribe().then(() => {
          this.connection.lindex('listeners', 0, (err, id) => {
            if (!err) {
              if (this.id === Number(id)) {
                this.connection.lpop('listeners', () => (new Generator(this.connection, Number(this._lastMessage) + 1)).run())
              } else {
                this.subscribe().catch(console.error)
              }
            } else console.error(err)
          })
        }).catch(console.error)
      } else {
        const messageProcessing = (msg, callback) => {
          this._lastMessage = msg

          const onComplete = () => {
            var error = Math.random() > 0.85
            callback(error, msg)
          }

          // Simulate work...
          setTimeout(onComplete, Math.floor(Math.random() * 1000))
        }

        messageProcessing(message, (err, msg) => {
          if (err) {
            this.unsubscribe()
              .then(() => new Promise((res, rej) => this.connection.send_command('lpush', ['errorList', msg], e => e ? rej(e) : res())))
              .then(() => this.subscribe())
              .catch(console.error)
          } else console.log('Completed message:', msg)
        })
      }
    }

    this.connection.on('message', eventHandler)
    this.subscribe()
  }

  unsubscribe () {
    return new Promise((res, rej) => this.connection.unsubscribe(channels.messages, (e, r) => e ? rej(e) : res(r)))
  }

  subscribe () {
    return new Promise((res, rej) => this.connection.subscribe(channels.messages, (e, r) => e ? rej(e) : res(r)))
  }
}
