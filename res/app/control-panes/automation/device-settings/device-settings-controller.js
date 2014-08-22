module.exports = function DeviceSettingsCtrl($scope, $timeout) {
  $scope.wifiEnabled = true

  var getWifiStatus = function () {
    if ($scope.control) {
      $scope.control.getWifiStatus().then(function (result) {
        $scope.$apply(function () {
          $scope.wifiEnabled = (result.lastData === 'wifi_enabled')
        })
      })
    }

  }
  getWifiStatus()

  $scope.toggleWifi = function () {
    if ($scope.control) {
      $scope.control.setWifiEnabled(!$scope.wifiEnabled)
      $scope.wifiEnabled = !$scope.wifiEnabled
      $timeout(getWifiStatus, 500)
    }
  }
}