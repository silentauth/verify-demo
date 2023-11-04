const { parsePhoneNumber } = require('libphonenumber-js')
const db = require('../models')
const { createJWT } = require('../utils/auth')
const vonage = require('../utils/vonage')

async function login(req, res) {
  console.log('login() - triggered')
  const { phone_number, country_code } = req.body

  if (!phone_number || !country_code) {
    console.log('login() - returned error.. phone_number or country_code not provided')
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
      console.log(`login() - ${phone_number} - returning request_id: ${verify.body.request_id} check_url: ${verify.body.check_url}`)
      user.update({ vonage_verify_request_id: verify.body.request_id})

      return res.status(200).json({ 
        requestId: verify.body.request_id, 
        checkUrl: verify.body.check_url
      })
      
    } else if (verify.status === 409) {
      console.log(`login() - ${phone_number} - 409 status - ${verify.body.detail}`)
      return res.status(400).json({ error: verify.body.detail })
    } else if (verify.status === 422) {
      console.log(`login() - ${phone_number} - 422 status - ${verify.body.detail}`)
      return res.status(400).json({ error: verify.body.detail})
    } else {
      console.log(`login() - ${phone_number} - vonage status returned: ${verify.status}. Detail: ${verify.body.detail}`)
      return res.status(500).json({ error:  'Server Error' })
    }
  } else {
    // Phone number not parseable or valid, return error
    console.log(`login() - ${phone_number} - phone number is not a valid number`)
    return res.status(400).json({ error: "Phone number is not valid" })
  }
}

async function verify(req, res) {
  console.log('verify() - triggered')
  const { request_id, pin } = req.body

  if (!request_id || !pin) {
    console.log('verify() - returned error.. request_id or pin not provided')
    return res.status(400).json({ error: "A `request_id` or `pin` was not provided." })
  }

  const user = await db.User.findOne({ where: { vonage_verify_request_id: request_id } })

  if (!user) {
    // User doesn't exist.. return 404
    console.log(`verify() - ${request_id} - User not found`)
    return res.sendStatus(404)
  }

  const verify = await vonage.verifyRequest(request_id, pin)

  if (verify.status === 200) {
    console.log(`verify() - ${request_id} - returning jwt, user verified`)
    // Clear requestId from database
    user.update({ vonage_verify_request_id: null })

    // Create a JWT for the user
    const jwt = createJWT(user.id)

    // Return the JWT
    return res.status(200).json({ success: 'Account verified!', token: jwt })
  } else if (verify.status >= 400 && verify.status < 500) {
    console.log(`verify() - ${request_id} - status returned between 400 and 500 - ${verify.body.detail}`)
    return res.status(400).json({ error: verify.body.detail})
  } else {
    console.log(`verify() - ${request_id} - vonage status returned: ${verify.status}. Detail: ${verify.body.detail}`)
    return res.status(500).json({ error: 'Server Error' })
  }
}

function device(req, res) {
  console.log('device() - triggered')
  const deviceId = req.query.deviceId;
  const jwt = createJWT(deviceId, 'device-verify')

  res.status(200).json({ token: jwt })
}

async function callback(req, res) {
  console.log('callback() - triggered')
  console.log('callback = ', JSON.stringify(req.body))

  if (req.body.type === "summary" && ["expired", "failed"].includes(req.body.status)) {
    console.log(`callback() - ${req.body.request_id} - type is summary, and status is ${req.body.status}`)
    const user = await db.User.findOne({ where: { vonage_verify_request_id: req.body.request_id } })

    if (!user) {
      // No user found, return false
      console.log(`callback() - ${req.body.request_id} - user not found`)
      return res.status(200).json({})
    }

    user.update({ vonage_verify_check_url: null, vonage_verify_status: null })

    return res.status(200).json({})
  }

  if (req.body.type !== "event") {
    return res.status(200).json({})
  }

  console.log('callback() - type is event, and status is ' + req.body.status)

  // Check to make sure the callback is the initial callback for a `silent_auth` with 
  // status: `pending`, and contains an action with type `check` and a `check_url`
  const statusCallback = await vonage.statusCallback(req)

  if (statusCallback !== false) {
    const user = await db.User.findOne({ where: { vonage_verify_request_id: statusCallback.request_id } })

    if (!user) {
      // No user found, return false
      console.log(`callback() - Status Callback - user not found with request_id: ${statusCallback.request_id}`)
      return res.status(200).json({})
    }

    if (statusCallback.check_url !== 'defined') {
      user.update({ vonage_verify_check_url: statusCallback.check_url, vonage_verify_status: statusCallback.status })
    } else {
      user.update({ vonage_verify_status: statusCallback.status })
    }

    return res.status(200).json({})
  }

  // Check to make sure the callback is the status Update callback for a `silent_auth` with 
  // status either `completed`, `user_rejected`, `failed`, or `expired`.
  const completeCallback = await vonage.completeCallback(req)

  if (completeCallback !== false) {
    const user = await db.User.findOne({ where: { vonage_verify_request_id: completeCallback.request_id } })

    if (!user) {
      // No user found, return false
      console.log(`callback() - Event Callback - user not found with request_id: ${completeCallback.request_id}`)
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
    console.log('getCheckStatus() - requestId not provided - returning 404')
    return res.sendStatus(404);
  }

  console.log(`getCheckStatus() - ${requestId} - Triggered`)

  // Check a user exists with this requestId
  const user = await db.User.findOne({ where: { vonage_verify_request_id: requestId } })

  if (!user) {
    console.log(`getCheckStatus() - ${requestId} - user not found - returning 404`)
    return res.sendStatus(404);
  }

  // If status is `action_pending`, and there is a `check_url` in the database, return this `check_url`
  if (user.vonage_verify_status === 'action_pending' && user.vonage_verify_check_url !== null) {
    console.log(`getCheckStatus() - ${requestId} - status: action_pending`);

    return res.status(200).json({check_url: user.vonage_verify_check_url})
  } else if (user.vonage_verify_status === 'completed') {
    user.update({ vonage_verify_check_url: null, vonage_verify_status: null, vonage_verify_request_id: null })
    console.log(`getCheckStatus() - ${requestId} - status: complete`);
    // Create a JWT for the user
    const jwt = createJWT(user.id)

    // Return the JWT
    return res.status(200).json({ success: 'Account verified!', token: jwt })
  } else if (user.vonage_verify_status === 'user_rejected') {
    user.update({ vonage_verify_check_url: null, vonage_verify_status: null, vonage_verify_request_id: null })
    console.log(`getCheckStatus() - ${requestId} - status: user_rejected (Not a match)`);

    return res.sendStatus(401)
  } else if (['expired', 'failed'].includes(user.vonage_verify_status)) {
    console.log(`getCheckStatus() - ${requestId} - status: ${user.vonage_verify_status}`);
    user.update({ vonage_verify_check_url: null, vonage_verify_status: null })

    return res.sendStatus(302)
  }

  console.log(`getCheckStatus() - ${requestId} - Unexpected Error - status is not action_pending, completed, user_rejected, failed, or expired`);
  // user.update({ vonage_verify_check_url: null, vonage_verify_status: null, vonage_verify_request_id: null })
  console.log(user.vonage_verify_check_url, ' - ', user.vonage_verify_status, ' - ', user.vonage_verify_request_id)

  return res.sendStatus(400)
}

module.exports = {
  device,
  login,
  verify,
  callback,
  getCheckStatus
}
