///controllers.js
var app = angular.module('starter');

app.controller('AppCtrl', [
  'User',
  function (User) {
    'use strict';
    var appVM = this;
    appVM.logout = User.logout;
  }])
  .controller('HomeCtrl', [
    '$scope',
    '$ionicPopup',
    'User',
    'auth',
    '$ionicLoading',
    'Data',
    '$ionicModal',
    function ($scope, $ionicPopup, User, auth, $ionicLoading, Data, $ionicModal) {
      'use strict';
      var loadData = function () {
        $ionicLoading.show();
        Data.getAll().then(function (data) {
          $scope.items = data;
          $ionicLoading.hide();
        });
      },
        addModal = {};
      $ionicModal.fromTemplateUrl('templates/updateItem.html', {
        scope: $scope
      }).then(function (modal) {
        addModal = modal;
      });
      $scope.delete = function (item) {
        $ionicPopup.confirm({
          title: 'Delete Item',
          template: 'Are you sure you want to delete?'
        }).then(function (res) {
          if (res) {
            item.$remove().then(function () {
              loadData();
            });
          }
        });
      };
      $scope.createItem = function () {
        $scope.data = {
          createName: "",
          initialValue: ""
        };
        $ionicPopup.show({
          scope: $scope,
          title: "Create Item",
          template: "<p>Name:</p><input type='text' ng-model='data.createName'/><p>Start Value:</p><input type='number' ng-model='data.initialValue' value=0 />",
          buttons: [{
            text: "Save",
            type: "button-positive",
            onTap: function (e) {
              if (!$scope.data.createName) {
                return e.preventDefault();
              }
              return $scope.data;
            }
          }, {
            text: "Cancel"
          }]
        }).then(function (res) {
          Data.create({name: res.createName, value: res.initialValue})
            .then(function () { /// succ) {
              loadData();
            }, function (err) {
              console.log(err);
            });
        });
      };
      $scope.showUpdate = function (item) {
        $scope.currentItem = item;
        $scope.data.increase = 0;
        addModal.show();
      };
      $scope.cancelUpdate = function () {
        addModal.hide();
      };
      $scope.doUpdate = function (change, currentItem) {
        Data.update(change, currentItem)
          .then(function () {
            loadData();
            $scope.data.increase = 0;
            addModal.hide();
          }, function (err) {
            console.log(err);
            window.alert(JSON.stringify(err));
          });
      };
      $scope.data = {
        email: '',
        password: ''
      };
      if (!auth) {
        $ionicPopup.show({
          title: 'Access TrackMe',
          subTitle: 'Enter Email and Password',
          scope: $scope,
          // templateUrl: 'templates/login.html',
          template: '<p>Email</p><input type="email" ng-model="data.email"><p>Password</p><input type="password" ng-model="data.password">',
          buttons: [ {
            type: 'button-positive',
            text: 'Let\'s Go!',
            onTap: function (e) {
              if (!$scope.data.email || !$scope.data.password) {
                return e.preventDefault();
              }
              return $scope.data;
            }
          }]
        }).then(function (res) {
          User.login(res)
            .then(function (user) {
              if (!user.uid) {
                $ionicPopup.alert({
                  title: 'Sign In Failed',
                  template: 'Please try again'
                }).then(function () {
                  window.location.reload();
                });
              } else {
                loadData();
              }
            });
        });
      } else {
        loadData();
      }
    }]);
