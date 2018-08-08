# web-push-example
Node.js server &amp; browser client example of Web Push Notification.

![demo](https://user-images.githubusercontent.com/6227288/43847095-cce97fd4-9b6a-11e8-821e-dd69c0ead8b4.gif)

### How to develop

#### Preparation

```
# 1. Clone this repo.

git clone https://github.com/subuta/web-push-example
```

#### Build & Start server

1. Run `npm i` to for install dependencies.
2. Run `npm run generate-vk` to generate VAPID Keys or grab that(Public Key/Private Key) from `https://web-push-codelab.glitch.me/`
3. Run `npm build` for build assets.
4. Run `npm start` for starting server.
5. Open `http://localhost:5000` for testing :)