const argv = require('minimist')(process.argv.slice(2))
const redis = require('redis')
const Generator = require('./generator')
const Listener = require('./listener')

const port = argv.port || 6379
const host = argv.host || '127.0.0.1'
const isGenerator = argv.generator
const errorList = 'errorList'

const connection = redis.createClient({ host, port })

if (argv['get-errors']) {
  // Get errors, delete them and quit
  connection.lrange(errorList, 0, -1, (err, list) => {
    if (!err) console.log(list)
    else console.error(err)
    connection.del(errorList, err => {
      if (!err) {
        connection.quit()
        process.exit(0)
      } else console.log(err)
    })
  })
} else {
  if (isGenerator) (new Generator(connection)).run()
  else (new Listener(connection)).run()
}
