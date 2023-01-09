const fetch = require('node-fetch')
const Vonage = require('@vonage/server-sdk')

var vonage = null

async function getVonageCreds() {
  if (vonage === null) {
    vonage = await generateJWT()
  }

  return vonage
}

async function generateJWT() {
  const applicationId = process.env.VONAGE_APPLICATION_ID
  const privateKey = process.env.APPLICATION_PRIVATE_KEY_PATH
  const sub = 'api'

  const vonageClient = new Vonage({
    applicationId: applicationId,
    privateKey: privateKey
  })

  let claims = {
    exp: Math.round(new Date().getTime() / 1000) + 86400,
    acl: {
      paths: {
        "/*/users/**": {},
        "/*/conversations/**": {},
        "/*/sessions/**": {},
        "/*/devices/**": {},
        "/*/image/**": {},
        "/*/media/**": {},
        "/*/applications/**": {},
        "/*/push/**": {},
        "/*/knocking/**": {},
        "/*/legs/**": {}
      }
    }
  }

  if (sub != null) {
    claims.sub = sub
  }

  return vonageClient.generateJwt(claims)
}

async function createRequest(phoneNumber) {
  const brand = process.env.BRAND_NAME

  const body = {brand: brand, workflow: [
    {channel: "silent_auth", to: phoneNumber}, 
    {channel: "sms", to: phoneNumber},
    {channel: "voice", to: phoneNumber}
  ]};

  const vonage = await getVonageCreds()
  const response = await fetch('https://api.nexmo.com/v2/verify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vonage}`,
    },
  });

  const data = await response.json();

  return { status: response.status, body: data}
}

async function verifyRequest(requestId, code) {
  const body = {code: code};

  const vonage = await getVonageCreds()
  const response = await fetch(`https://api.nexmo.com/v2/verify/${requestId}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vonage}`,
    },
  });

  var dataResponse = {};

  if (response.status !== 200) {
    dataResponse = await response.json()
  }

  return { status: response.status, body: dataResponse}
}

async function statusCallback(req) {
  const { request_id, type, channel, status, action } = req.body

  if (!request_id || !type || !channel || !status || !action) {
    return false
  }

  if (channel !== 'silent_auth' || status !== 'action_pending' || action.type !== 'check' || !action.check_url) {
    return false
  }

  // Do the next thing!
  return { request_id: request_id, status: status, type: action.type, check_url: action.check_url }
}

async function completeCallback(req) {
  const { request_id, type, channel, status } = req.body

  if (!request_id || !type || !channel || !status) {
    return false
  }

  if (channel !== 'silent_auth') {
    return false
  }

  return { request_id: request_id, status: status }
}

module.exports = {
  createRequest,
  verifyRequest,
  statusCallback,
  completeCallback
};