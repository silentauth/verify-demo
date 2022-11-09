const { parsePhoneNumber } = require('libphonenumber-js')
const Vonage = require('@vonage/server-sdk')
const db = require('../models')
const { createJWT } = require('../utils/auth')

var vonage = null

function createVonageCreds() {
  if (vonage === null) {
    vonage = new Vonage({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET
    });
  }

  return vonage
}

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
    createVonageCreds().verify.request({
      number: parsedPhoneNumber.number,
      brand: process.env.BRAND_NAME,
      workflow_id: process.env.VONAGE_VERIFY_WORKFLOW
    }, (err, result) => {
      if (err) {
        res.status(500).json({ error:  'Server Error' })
      } else {
        let requestId = result.request_id;
  
        if (result.status == '0') {
          user.update({ vonage_verify_request_id: requestId})

          res.status(200).json({ requestId: requestId })
        } else {
          res.status(401).json({ error: result.error_text })
        }
      }
    });

    return
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

    createVonageCreds().verify.request({
      number: parsedPhoneNumber.number,
      brand: process.env.BRAND_NAME,
      workflow_id: process.env.VONAGE_VERIFY_WORKFLOW
    }, (err, result) => {
      if (err) {
        res.status(500).json({ error:  'Server Error' })
      } else {
        let requestId = result.request_id;
  
        if (result.status == '0') {
          user.update({ vonage_verify_request_id: requestId})

          res.status(200).json({ requestId: requestId })
        } else {
          res.status(401).json({ error: result.error_text })
        }
      }
    });

    return
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

  createVonageCreds().verify.check({
    request_id: request_id,
    code: pin
  }, (err, result) => {
    if (err) {
      res.status(500).json( { error: 'Server Error' })
    } else {
      console.log(result);
      if (result && result.status == '0') {
        // Clear requestId from database
        user.update({ vonage_verify_request_id: null })
            
        // Create a JWT for the user
        const jwt = createJWT(user.id)

        // Return the JWT
        res.status(200).json({ success: 'Account verified!', token: jwt })
      } else {
        res.status(401).json({ message: { error: result.error_text } })
      }
    }
  });
}

function device(req, res) {
  const deviceId = req.query.deviceId;
  const jwt = createJWT(deviceId, 'device-verify')

  res.status(200).json({ token: jwt })
}

async function cancelVerify(req, res) {
  const { phone_number, country_code } = req.body;

  if (!phone_number || !country_code) {
    res.status(400).json({ message: "A `phone_number`, or `country_code` has not be submitted" })

    return
  }

  const parsedPhoneNumber = parsePhoneNumber(phone_number, country_code)

  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    const user = await db.User.findOne({ where: { parsed_phone_number: parsedPhoneNumber.number } })

    if (!user || user.vonage_verify_request_id === null) {
      // User already exists.. Unable to cancel verification
      res.sendStatus(404)

      return
    }

    createVonageCreds().verify.control({
      request_id: user.vonage_verify_request_id,
      cmd: 'cancel'
    }, (err, result) => {
      if (err) {
        res.status(500).json( { error: 'Server Error' })

        return;
      } else {
        user.update({ vonage_verify_request_id: null })

        res.status(200).json({ message: 'Verification cancelled!' })
      }
    });
  }
}

module.exports = {
  device,
  register,
  login,
  verify,
  cancelVerify
}
