const channels = require('./channels')

module.exports = class Generator {
  constructor (connection, messageCounter = 0) {
    this.connection = connection
    this.messageCounter = messageCounter

    process.on('exit', () => this.connection.publish(channels.system, 'GENERATOR_DISCONNECTED'))
  }

  run () {
    const generate = () => {
      console.log('Emit message:', this.messageCounter)
      this.connection.publish(channels.messages, this.messageCounter++)
    }

    setInterval(generate, 500)

    // Simulate crash of generator
    setTimeout(() => undefined_variable, 5000)
  }
}
