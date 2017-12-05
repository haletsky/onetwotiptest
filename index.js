const argv = require('minimist')(process.argv.slice(2))
const redis = require('redis')

if (argv['get-error']) {
  // TODO: console out all errors from redis and clean up database
}

const port = argv.port || 6379
const host = argv.host || '127.0.0.1'

const client = redis.createClient({
  host,
  port
})

client.quit()
