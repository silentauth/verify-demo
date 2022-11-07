const db = require('../models')

async function securedPage(req, res) {
  console.log(req.user.sub);

  const user = await db.User.findOne({ where: { id: req.user.sub } })

  if (!user) {
    // User already exists.. redirect to register
    res.sendStatus(404)

    return
  }

  res.status(200).json({ phone_number: user.parsed_phone_number })
}

module.exports = {
  securedPage
}