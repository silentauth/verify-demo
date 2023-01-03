const { parsePhoneNumber } = require('libphonenumber-js')
const db = require('../models')
const { createJWT } = require('../utils/auth')
const vonage = require('../utils/vonage')

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
    const verify = await vonage.createRequest(parsedPhoneNumber.number)

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
    res.status(400).json({ message: "A Phone number or country code has not be submitted" })
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
    const verify = await vonage.createRequest(parsedPhoneNumber.number)

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
    res.status(400).json({ error: "A `request_id` or `pin` was not provided." })

    return
  }

  const user = await db.User.findOne({ where: { vonage_verify_request_id: request_id } })

  if (!user) {
    // User doesn't exist.. return 404
    res.sendStatus(404)

    return;
  }

  const verify = await vonage.verifyRequest(request_id, pin)

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
    return res.status(500).json({ error: 'Server Error' })
  }
}

function device(req, res) {
  const deviceId = req.query.deviceId;
  const jwt = createJWT(deviceId, 'device-verify')

  res.status(200).json({ token: jwt })
}

async function callback(req, res) {
  if (req.body.type === "summary" && req.body.status === "expired") {
    const user = await db.User.findOne({ where: { vonage_verify_request_id: req.body.request_id } })

    if (!user) {
      // No user found, return false
      return res.status(200).json({})
    }

    user.update({ vonage_verify_check_url: null, vonage_verify_status: null })

    return res.status(200).json({})
  }

  if (req.body.type !== "event") {
    return res.status(200).json({})
  }

  // Check to make sure the callback is the initial callback for a `silent_auth` with 
  // status: `pending`, and contains an action with type `check` and a `check_url`
  const statusCallback = await vonage.statusCallback(req)

  if (statusCallback !== false) {
    const user = await db.User.findOne({ where: { vonage_verify_request_id: statusCallback.request_id } })

    if (!user) {
      // No user found, return false
      return res.status(404).json({})
    }

    user.update({ vonage_verify_check_url: statusCallback.check_url, vonage_verify_status: statusCallback.status })

    return res.status(404).json({})
  }

  // Check to make sure the callback is the status Update callback for a `silent_auth` with 
  // status either `completed`, `user_rejected`, `failed`, or `expired`.
  const completeCallback = await vonage.completeCallback(req)

  if (completeCallback !== false) {
    const user = await db.User.findOne({ where: { vonage_verify_request_id: completeCallback.request_id } })

    if (!user) {
      // No user found, return false
      return res.status(200).json({})
    }

    user.update({ vonage_verify_check_url: null, vonage_verify_status: completeCallback.status })

    return res.status(200).json({})
  }

  return res.status(200).json({})
}

async function getCheckStatus(req, res) {
  // Check request contains `request_id`
  const requestId = req.query.request_id;

  if (requestId === null || requestId === undefined) {
    return res.sendStatus(404);
  }

  // Check a user exists with this requestId
  const user = await db.User.findOne({ where: { vonage_verify_request_id: requestId } })

  if (!user) {
    return res.sendStatus(404);
  }

  // If status is `action_pending`, and there is a `check_url` in the database, return this `check_url`
  if (user.vonage_verify_status === 'action_pending' && user.vonage_verify_check_url !== null) {
    console.log('getCheckStatus() - Action pending');

    return res.status(200).json({check_url: user.vonage_verify_check_url})
  } else if (user.vonage_verify_status === 'completed') {
    user.update({ vonage_verify_check_url: null, vonage_verify_status: null, vonage_verify_request_id: null })
    console.log('getCheckStatus() - Verification completed');
    // Create a JWT for the user
    const jwt = createJWT(user.id)

    // Return the JWT
    return res.status(200).json({ success: 'Account verified!', token: jwt })
  } else if (user.vonage_verify_status === 'user_rejected') {
    user.update({ vonage_verify_check_url: null, vonage_verify_status: null, vonage_verify_request_id: null })
    console.log('getCheckStatus() - User Rejected (Not a match)');

    return res.sendStatus(401)
  } else if (user.vonage_verify_status === 'expired') {
    user.update({ vonage_verify_check_url: null, vonage_verify_status: null })
    console.log('getCheckStatus() - Expired');

    return res.sendStatus(302)
  }

  user.update({ vonage_verify_check_url: null, vonage_verify_status: null, vonage_verify_request_id: null })
  console.log('getCheckStatus() - Unexpected Error');

  return res.sendStatus(400)
}

module.exports = {
  device,
  register,
  login,
  verify,
  callback,
  getCheckStatus
}
