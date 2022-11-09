const jwt = require('jsonwebtoken');

function createJWT(sub, iss = 'vonage-verify-demo') {
  let jwtSecretKey = process.env.JWT_SECRET_PHRASE;
  let data = { iss: iss, sub: sub }

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

function verifyDevice(req, res, next) {
  const authHeader = req.headers['silent-auth']
  const deviceId = req.headers['device-id']

  if (authHeader == null) return res.sendStatus(401)

  jwt.verify(authHeader, process.env.JWT_SECRET_PHRASE, (err, device) => {
    if (err) return res.sendStatus(403)

    if (device.sub !== deviceId) {
      return res.sendStatus(403)
    }

    next()
  })
}

module.exports = {
  createJWT,
  verifyJWT,
  verifyDevice
};