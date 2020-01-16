var http = require('http')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')
var basicAuth = require('basic-auth')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')

module.exports = function (options) {
  var log = logger.createLogger('auth-mock')
  var app = express()
  var server = Promise.promisifyAll(http.createServer(app))

  lifecycle.observe(function () {
    log.info('Waiting for client connections to end')
    return server.closeAsync()
      .catch(function () {
        // Okay
      })
  })

  // BasicAuth Middleware
  var basicAuthMiddleware = function (req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.send(401)
    }

    var user = basicAuth(req)

    if (!user || !user.name || !user.pass) {
      return unauthorized(res)
    }

    if (user.name === options.mock.basicAuth.username &&
      user.pass === options.mock.basicAuth.password) {
      return next()
    }
    else {
      return unauthorized(res)
    }
  }

  app.set('view engine', 'pug')
  app.set('views', pathutil.resource('auth/mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(cookieSession({
    name: options.ssid
    , keys: [options.secret]
  }))
  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())
  app.use('/static/bower_components',
    serveStatic(pathutil.resource('bower_components')))
  app.use('/static/auth/mock', serveStatic(pathutil.resource('auth/mock')))

  app.use(function (req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken())
    next()
  })

  if (options.mock.useBasicAuth) {
    app.use(basicAuthMiddleware)
  }

  app.get('/', function (req, res) {
    res.redirect('/auth/mock/')
  })

  app.get('/auth/mock/', function (req, res) {
    if (req.query.userId) {
      var httpOptions = {
        hostname: `http://admin.soloyuedu.com/api/admin/seller/order/${req.query.orderId}/info`,
        port: 80,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'cookie': 'token=316a3bb681e8435bf6ec28332122611b'
        }
      }
      var req = http.request(httpOptions, function (res2) {
        console.log('Status:', res2.statusCode);
        console.log('headers:', JSON.stringify(res2.headers));
        res2.setEncoding('utf-8');
        res2.on('data', function (chun) {
          console.log('body分隔线---------------------------------\r\n');
          console.info(chun);
          var userId = req.query.userId
          console.log("TCL: userId", userId)
          var log = logger.createLogger('auth-mock')
          log.setLocalIdentifier(req.ip)
          console.log("TCL: options.appUrl", options.appUrl)
          var token = jwtutil.encode({
            payload: {
              email: `${userId}.test.com`
              , name: userId
            }
            , secret: options.secret
            , header: {
              exp: Date.now() + 24 * 3600
            }
          })
          var deviceId = '892QAET84W24R'
          var nextUrl = urlutil.addParams(options.appUrl, {
            jwt: token,
            deviceId: deviceId
          })
          console.log(nextUrl)
          res.redirect(nextUrl)
        });
        res.on('end', function () {
          console.log('No more data in response.********');
        });
      })
    } else {
      res.render('index')
    }
  })

  app.post('/auth/api/v1/mock', function (req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    var userName = req.query.username
    console.log(userName);
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
        })
          .then(function () {
            log.info('Authenticated "%s"', req.body.email)
            var token = jwtutil.encode({
              payload: {
                email: req.body.email
                , name: req.body.name
              }
              , secret: options.secret
              , header: {
                exp: Date.now() + 24 * 3600
              }
            })
            res.status(200)
              .json({
                success: true
                , redirect: urlutil.addParams(options.appUrl, {
                  jwt: token
                })
              })
          })
          .catch(requtil.ValidationError, function (err) {
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
                , validationErrors: err.errors
              })
          })
          .catch(function (err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
                , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
