const jwt = require('jsonwebtoken');

function createJWT(userId) {
  let jwtSecretKey = process.env.JWT_SECRET_PHRASE;
  let data = { iss: 'vonage-verify-demo', sub: userId }

  const token = jwt.sign(data, jwtSecretKey);

  return token
}

function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET_PHRASE, (err, user) => {
    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}

module.exports = {
  createJWT,
  verifyJWT
};