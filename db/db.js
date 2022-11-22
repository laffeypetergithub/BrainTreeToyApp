const { Pool, Client } = require('pg')

const pool = new Pool({
  user: 'peterlaffey',
  host: 'localhost',
  database: 'peterlaffey',
  password: '',
  port: 5432,
})


pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})
