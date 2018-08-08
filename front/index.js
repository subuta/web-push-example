const APPLICATION_SERVER_PUBLIC_KEY = process.env.APPLICATION_SERVER_PUBLIC_KEY
const WEB_SERVICE_URL = process.env.WEB_SERVICE_URL

let isSubscribed = false
let swRegistration = null

function urlB64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function updateSubscriptionOnServer (method, subscription) {
  return window.fetch(`${WEB_SERVICE_URL}/registrations`, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(subscription)
  })
}

function subscribeUser () {
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(APPLICATION_SERVER_PUBLIC_KEY)
  })
    .then(function (subscription) {
      console.log('User is subscribed.')

      console.log('subscription = ', subscription)

      updateSubscriptionOnServer('POST', subscription)

      isSubscribed = true
    })
    .catch(function (err) {
      console.log('Failed to subscribe the user: ', err)
    })
}

function unsubscribeUser () {
  swRegistration.pushManager.getSubscription()
    .then(function (subscription) {
      if (subscription) {
        return subscription.unsubscribe()
      }
    })
    .catch(function (error) {
      console.log('Error unsubscribing', error)
    })
    .then(function () {
      updateSubscriptionOnServer('DELETE', null)

      console.log('User is unsubscribed.')
      isSubscribed = false
    })
}

const bindEventListeners = () => {
  const $unsubscribe = document.querySelector('#unsubscribe')
  $unsubscribe.addEventListener('click', (e) => {
    unsubscribeUser()
  })

  const $notify = document.querySelector('#notify')
  $notify.addEventListener('click', (e) => {
    window.fetch(`${WEB_SERVICE_URL}/notify`, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({})
    })
  })
}

const onReady = () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Web Push is supported')

    bindEventListeners()

    navigator.serviceWorker.register('sw.js')
      .then(function (swReg) {
        console.log('Service Worker is registered', swReg)

        swRegistration = swReg
        subscribeUser()
      })
      .catch(function (error) {
        console.error('Service Worker Error', error)
      })
  } else {
    console.warn('Web Push messaging is not supported')
  }
}

// Native
// Check if the DOMContentLoaded has already been completed
if (document.readyState !== 'loading') {
  onReady()
} else {
  document.addEventListener('DOMContentLoaded', onReady)
}