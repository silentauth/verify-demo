# Vonage Verify Demo

## Server Setup

You'll need a [Vonage developer account](https://dashboard.nexmo.com/), with an application ID and the `private.key` file for this application. Run the three commands below and populate the newly created `.env` file with your Vonage credentials. The [workflow](https://developer.vonage.com/api/verify.v2#newRequest) is configured to SMS -> TTS. However this can be defined however you wish in the `./Server/src/utils/vonage.js` `createRequest` method.

```bash
cd Server
npm install
cp .env.example .env
npx sequelize-cli db:migrate  # This example uses SQLite3. This command will create the sqlite3 database file, and run any migrations.
```

Run the server with the following command:

```bash
npm run dev # This will output an ngrok URL. Copy this for the next section.
```

## Mobile App Setup

Install all third party libraries, copy the `.env.example` file to `.env` and update the value of `SERVER_BASE_URL` in `.env` to be the value of your ngrok URL.

```bash
cd MobileApp
npm install
cd ios && pod install # For ios devices.
cp .env.example .env
```

### Run on Android

```bash
npm run android
```

### Run on iPhone

```bash
npm run ios
```
