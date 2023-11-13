let mysql      = require('mysql');

let connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'mss',
  password : 'anstkdtjr2',
  database : 'ttocookre'
});
connection.connect(function(err){
  if (err) console.log(err);
  else console.log('Connected!');
});

module.exports = connection;