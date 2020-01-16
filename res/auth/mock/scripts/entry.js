require.ensure([], function(require) {
  console.log('require: ', require.query)
  require('nine-bootstrap')

  require('angular')
  require('angular-route')
  require('angular-touch')
  console.log('test...............');
  
  angular.module('app', [
    'ngRoute',
    'ngTouch',
    require('gettext').name,
    require('./signin').name
  ])
    .config(function($routeProvider, $locationProvider) {
      console.log($locationProvider);
      $locationProvider.html5Mode(true)
      $routeProvider
        .otherwise({
          redirectTo: '/auth/mock/'
        })
    })
})
