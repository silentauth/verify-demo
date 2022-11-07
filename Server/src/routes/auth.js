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
  }

  console.log()

  const parsedPhoneNumber = parsePhoneNumber(phone_number, country_code)

  if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
    const existingUser = await db.User.findOne({ where: { parsed_phone_number: parsedPhoneNumber.number } })

    if (existingUser) {
      // User already exists.. redirect to login
      res.status(400).json({ message: 'User already exists' })
      return;
    }

    // Create User in DB
    const user = await db.User.create({
      parsed_phone_number: parsedPhoneNumber.number,
      phone_number: parsedPhoneNumber.nationalNumber,
      country_code: country_code
    })

    // Submit Verification Request.
    createVonageCreds().verify.request({
      number: parsedPhoneNumber.number,
      brand: process.env.BRAND_NAME,
      workflow_id: 6
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
    const user = await db.User.findOne({ where: { parsed_phone_number: parsedPhoneNumber.number } })

    if (!user) {
      // User already exists.. redirect to register
      res.sendStatus(404)

      return
    }

    createVonageCreds().verify.request({
      number: parsedPhoneNumber.number,
      brand: process.env.BRAND_NAME,
      workflow_id: 6
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
    console.log('one isn\'t true')
    // Return error
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
        console.log('we creating JWT now!!')
        const jwt = createJWT(user.id)

        // Return the JWT
        res.status(200).json({ success: 'Account verified!', token: jwt })
      } else {
        res.status(401).json({ message: { error: result.error_text } })
      }
    }
  });
}

module.exports = {
  register,
  login,
  verify
}