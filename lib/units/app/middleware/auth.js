var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')

var dbapi = require('../../../db/api')

module.exports = function(options) {
  return function(req, res, next) {
    if (req.query.jwt) {
      console.log("TCL: req.query", req.query)
      console.log("TCL: req.query.jwt", req.query.jwt)
      // Coming from auth client
      var deviceId = req.query.deviceId
      console.log("TCL: deviceId", deviceId)
      var data = jwtutil.decode(req.query.jwt, options.secret)
      console.log("TCL: data", data)
      var redir = urlutil.removeParam(req.url, 'jwt')
      console.log("TCL: redir", redir)
      var redir = urlutil.removeParam(req.url, 'deviceId')
      console.log("TCL: redir", redir)
      if (data) {
        // Redirect once to get rid of the token
        dbapi.saveUserAfterLogin({
            name: data.name
          , email: data.email
          , ip: req.ip
          })
          .then(function() {
            req.session.jwt = data
            if (req.query.deviceId) {
              res.redirect(`/#!/control/${deviceId}`)
            } else {
              res.redirect(redir)
            }
          })
          .catch(next)
      }
      else {
        // Invalid token, forward to auth client
        res.redirect(options.authUrl)
      }
    }
    else if (req.session && req.session.jwt) {
      dbapi.loadUser(req.session.jwt.email)
        .then(function(user) {
          if (user) {
            // Continue existing session
            req.user = user
            next()
          }
          else {
            // We no longer have the user in the database
            res.redirect(options.authUrl)
          }
        })
        .catch(next)
    }
    else {
      // No session, forward to auth client
      res.redirect(options.authUrl)
    }
  }
}
