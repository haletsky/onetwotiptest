const channels = require('./channels')

module.exports = class Generator {
  constructor (connection, messageCounter = 0) {
    this.connection = connection
    this.messageCounter = messageCounter

    // Handle crashes
    process.on('exit', () => this.connection.publish(channels.messages, 'GENERATOR_DISCONNECTED'))
    process.on('SIGINT', process.exit)
  }

  run () {
    const generate = () => {
      console.log('Emit message:', this.messageCounter)
      this.connection.publish(channels.messages, this.messageCounter++)
    }

    setInterval(generate, 500)

    // Simulate crash
    // setTimeout(() => undefined_variable, 5000)
  }
}
