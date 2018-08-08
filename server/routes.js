import Router from 'koa-router'
import webpush from 'web-push'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'

import {
  ROOT_DIR
} from '../config'

const router = new Router()

const VAPID_KEYS_JSON = path.resolve(ROOT_DIR, 'vapid_keys.json')

if (!fs.existsSync(VAPID_KEYS_JSON)) {
  console.error('Valid VAPID Key not found, generate it by running `npm run generate-vk`');
  process.exit(1);
}

const VAPID_KEYS = JSON.parse(fs.readFileSync(VAPID_KEYS_JSON, 'utf-8'));

router.post('/registrations', async (ctx) => {
  const subscription = ctx.request.body;

  const Subscriptions = ctx.db.get('subscriptions')

  const found = await Subscriptions
    .find(subscription)
    .value()

  if (!found) {
    await Subscriptions
      .push(subscription)
      .write()
  }

  const currentRows = Subscriptions.size().value()

  console.log('[subscribed]', JSON.stringify(subscription))
  console.log(`[subscribed] ${currentRows} subscription exists.`)

  ctx.body = ''
})

router.delete('/registrations', async (ctx) => {
  const subscription = ctx.request.body;

  const Subscriptions = ctx.db.get('subscriptions')

  await Subscriptions
    .remove(subscription)
    .write()

  const currentRows = Subscriptions.size().value()

  console.log('[unSubscribed]', JSON.stringify(subscription))
  console.log(`[unSubscribed] ${currentRows} subscription exists.`)

  ctx.body = ''
})

// Based on: https://glitch.com/edit/#!/web-push-codelab?path=app.js:21:0
router.post('/notify', async (ctx) => {
  const Subscriptions = ctx.db.get('subscriptions')
  const subscriptions = await Subscriptions.value()

  const options = {
    vapidDetails: {
      subject: process.env.WEB_SERVICE_URL,
      publicKey: VAPID_KEYS.publicKey,
      privateKey: VAPID_KEYS.privateKey
    },
    // 1 hour in seconds.
    TTL: 60 * 60
  };

  const promises = _.map(subscriptions, (subscription) => {
    console.log(subscription)
    return webpush.sendNotification(
      subscription,
      JSON.stringify({
        text: 'Some data from server.'
      }),
      options
    )
  })

  try {
    await Promise.all(promises)
  } catch (e) {
    console.error('e = ', e)
  }

  ctx.body = ''
})

export default router
