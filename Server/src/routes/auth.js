const { parsePhoneNumber } = require('libphonenumber-js')
const db = require('../models')
const { createJWT } = require('../utils/auth')
const { createRequest, verifyRequest } = require('../utils/vonage')

async function register(req, res) {
  const { phone_number, country_code } = req.body;

  if (!phone_number || !country_code) {
    res.status(400).json({ message: "A Phone number, or country code has not be submitted" })

    return
  }

  const parsedPhoneNumber = parsePhoneNumber(phone_number, country_code)

  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    const existingUser = await db.User.findOne({ where: { parsed_phone_number: parsedPhoneNumber.number } })
    var user = ''

    if (!existingUser) {
      // Create User in DB
      user = await db.User.create({
        parsed_phone_number: parsedPhoneNumber.number,
        phone_number: parsedPhoneNumber.nationalNumber,
        country_code: country_code
      })
    } else {
      user = existingUser
    }

    // Submit Verification Request.
    const verify = await createRequest(parsedPhoneNumber.number)

    if (verify.status === 202) {
      user.update({ vonage_verify_request_id: verify.body.request_id})

      return res.status(200).json({ requestId: verify.body.request_id })
    } else if (verify.status === 422) {
      return res.status(400).json({ error: verify.body.detail})
    } else {
      return res.status(500).json({ error:  'Server Error' })
    }
  } else {
    // Phone number not parseable or valid, return error
    res.status(400).json({ message: "Phone number is not valid" })
    return
  }
}

async function login(req, res) {
  const { phone_number, country_code } = req.body

  if (!phone_number || !country_code) {
    res.status(400).json({ message: "A Phone number, or country code has not be submitted" })
  }

  const parsedPhoneNumber = parsePhoneNumber(phone_number, country_code)

  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    var user = await db.User.findOne({ where: { parsed_phone_number: parsedPhoneNumber.number } })

    if (!user) {
      // User doesn't exist, create one!
      user = await db.User.create({
        parsed_phone_number: parsedPhoneNumber.number,
        phone_number: parsedPhoneNumber.nationalNumber,
        country_code: country_code
      })
    }

    // Submit Verification Request.
    const verify = await createRequest(parsedPhoneNumber.number)

    console.log(verify);
    if (verify.status === 202) {
      user.update({ vonage_verify_request_id: verify.body.request_id})

      return res.status(200).json({ requestId: verify.body.request_id })
    } else if (verify.status === 422) {
      return res.status(400).json({ error: verify.body.detail})
    } else {
      return res.status(500).json({ error:  'Server Error' })
    }
  } else {
    // Phone number not parseable or valid, return error
    res.status(400).json({ message: "Phone number is not valid" })
    return
  }
}

async function verify(req, res) {
  const { request_id, pin } = req.body

  if (!request_id || !pin) {
    res.status(400).json({ message: "A `request_id` or `pin` was not provided." })

    return
  }

  const user = await db.User.findOne({ where: { vonage_verify_request_id: request_id } })

  if (!user) {
    // User already exists.. redirect to register
    res.sendStatus(404)

    return;
  }

  const verify = await verifyRequest(request_id, pin)

  if (verify.status === 200) {
    // Clear requestId from database
    user.update({ vonage_verify_request_id: null })

    // Create a JWT for the user
    const jwt = createJWT(user.id)

    // Return the JWT
    res.status(200).json({ success: 'Account verified!', token: jwt })
  } else if (verify.status >= 400 && verify.status < 500) {
    return res.status(400).json({ error: verify.body.detail})
  } else {
    return res.status(500).json({ error:  'Server Error' })
  }
}

function device(req, res) {
  const deviceId = req.query.deviceId;
  const jwt = createJWT(deviceId, 'device-verify')

  res.status(200).json({ token: jwt })
}

async function callback(req, res) {
  console.log('--------- callback -------------')
  console.log(req.body)
  console.log('--------- end callback ---------')
}

module.exports = {
  device,
  register,
  login,
  verify,
  callback
}
