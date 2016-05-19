// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var homeResolve = {
  auth: [
    'User',
    function (User) {
      'use strict';
      return User.login();
    }
  ]
};

var app = angular.module('starter', ['ionic', 'firebase', 'ngStorage']);
app.value("FB_URL", "https://track-me-app.firebaseio.com");
app.run(function ($ionicPlatform) {
  'use strict';
  $ionicPlatform.ready(function () {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      window.StatusBar.styleDefault();
    }
  });
});
app.config(function ($stateProvider, $urlRouterProvider) {
  'use strict';
  $stateProvider
    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'AppCtrl as appVM'
    })
    .state('app.home', {
      url: '/home',
      views: {
        'menuContent': {
          templateUrl: 'templates/home.html',
          controller: 'HomeCtrl',
          resolve: homeResolve
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});


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
        }, function () { ///err) {
          $scope.appVM.logout();
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
          template: "<p>Name:</p><input type='text' ng-model='data.createName'/><p>Start Value:</p><input type='number' ng-model='data.initialValue' value=0 /><p>Label:</p><input type='text' ng-model='data.label' />",
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
          Data.create({name: res.createName, value: res.initialValue, label: res.label})
            .then(function () { /// succ) {
              loadData();
            }, function (err) {
              console.log(err);
            });
        });
      };
      $scope.showUpdate = function (item) {
        $scope.currentItem = item;
        $scope.data.label = '';
        $scope.data.addLabel = '';
        $scope.data.increase = 0;
        addModal.show();
      };
      $scope.cancelUpdate = function () {
        addModal.hide();
      };
      $scope.toggleLabel = function (label) {
        if ($scope.data.label === label) {
          $scope.data.label = '';
          return;
        }
        $scope.data.label = label;
      };
      $scope.addLabel = function (label, item) {
        Data.addLabel({label: label, item: item})
          .then(function (item) {
            $scope.currentItem = item;
            $scope.data.label = label;
            $scope.data.addLabel = '';
          }, function (msg) {
            $ionicPopup.alert({
              title: "Error",
              template: msg.message
            });
          });
      };
      $scope.removeLabel = function (label, item) {
        $ionicPopup.confirm({
          title: "Are you sure?",
          template: "This cannot be undone. Your existing data will not be modified."
        }).then(function (res) {
          if (res) {
            Data.removeLabel({label: label, item: item})
              .then(function (item) {
                $scope.currentItem = item;
              });
          }
        });
      };
      $scope.doUpdate = function (change, label, currentItem) {
        Data.update(parseFloat(change.toFixed(2)), label, currentItem)
          .then(function () {
            loadData();
            $scope.data.increase = 0;
            $scope.data.label = '';
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
            }, function () { ///err) {
              $scope.appVM.logout();
            });
        });
      } else {
        loadData();
      }
    }]);

///services.js
var app = angular.module('starter');

app.factory('User', [
  '$firebaseAuth',
  '$localStorage',
  '$firebaseArray',
  'FB_URL',
  function ($firebaseAuth, $localStorage, $firebaseArray, FB_URL) {
    'use strict';
    var User = {},
      ref = new Firebase(FB_URL),
      auth = $firebaseAuth(ref),
      profileRef = {},
      getProfile = function (uid) {
        profileRef = $firebaseArray(ref.child(uid));
        return profileRef;
      };
    User.profileRef = function () {
      return profileRef;
    };
    User.authRef = function () {
      return ref;
    };
    User.create = function (userObj) {
      return auth.$createUser(userObj)
        .then(function (user) {
          $localStorage.auth = window.btoa(userObj.email + ":trackme:" + userObj.password);
          User.cached = user.uid;
          getProfile(user.uid);
          return user;
        }, function (err) {
          return err;
        });
    };
    User.login = function (userObj) {
      if (!userObj) {
        if (!$localStorage.auth) {
          return false;
        }
        var parts = window.atob($localStorage.auth).split(':trackme:');
        userObj = {
          email: parts[0],
          password: parts[1]
        };
      }
      return auth.$authWithPassword(userObj)
        .then(function (user) {
          $localStorage.auth = window.btoa(userObj.email + ":trackme:" + userObj.password);
          getProfile(user.uid);
          User.cached = user.uid;
          return user;
        }, function (err) {
          if (err.code === "INVALID_USER") {
            return User.create(userObj);
          }
          console.log(err);
          return err;
        });
    };
    User.logout = function () {
      delete $localStorage.auth;
      User.cached = {};
      window.location.reload();
    };
    return User;
  }]);


app.factory('Data', [
  '$q',
  'User',
  '$firebaseObject',
  'FB_URL',
  function ($q, User, $firebaseObject, FB_URL) {
    'use strict';
    var ref = new Firebase(FB_URL),
      Data = {};
    Data.getAll = function () {
      var d = $q.defer(),
        output = {};
      if (!User.cached) {
        return $q.reject({error: "No user"});
      }
      ref.child(User.cached).once('value', function (snapshot) {
        snapshot.forEach(function (obj) {
          output[obj.key()] = $firebaseObject(ref.child(User.cached).child(obj.key()));
        });
        return d.resolve(output);
      });
      return d.promise;
    };
    Data.addLabel = function (obj) {
      var d = $q.defer();
      if (!obj.item.labels) {
        obj.item.labels = [];
      }
      if (obj.item.labels.indexOf(obj.label) !== -1) {
        return $q.reject({message: "Label already exists"});
      }
      obj.item.labels.push(obj.label);
      obj.item.$save(function (ref) {
        return Data.getOne(ref.key);
      });
      return d.promise;
    };
    Data.removeLabel = function (obj) {
      var d = $q.defer(),
        index = obj.item.labels.indexOf(obj.label);
      if (index === -1) {
        return $q.reject({message: "Label does not exist"});
      }
      obj.item.labels.splice(index, 1);
      obj.item.$save(function (ref) {
        return Data.getOne(ref.key);
      });
      return d.promise;
    };
    Data.update = function (change, label, currentItem) {
      currentItem.entries.push({value: change, timestamp: +new Date(), label: label});
      currentItem.current_value += change;
      currentItem.current_value = parseFloat(currentItem.current_value.toFixed(2));
      currentItem.last_edited = +new Date();
      return currentItem.$save();
    };
    Data.getOne = function (name) {
      if (!User.cached) {
        return $q.reject({error: "No user"});
      }
      return $q.when($firebaseObject(ref.child(User.cached).child(name)));
    };
    Data.create = function (object) {
      var d = $q.defer();
      if (!User.cached) {
        return $q.defer().reject({error: "No user"});
      }
      Data.getOne(object.name)
        .then(function (fbObj) {
          if (fbObj.current_value) {
            return d.reject({message: "Already exists"});
          }
          fbObj.name = object.name;
          fbObj.entries = [{
            timestamp: +new Date(),
            value: object.value,
            label: object.label
          }];
          fbObj.labels = [object.label];
          fbObj.current_value = object.value;
          fbObj.last_edited = +new Date();
          fbObj.$save()
            .then(function () {
              return d.resolve(fbObj);
            }, function (err) {
              return d.reject(err);
            });
        });
      return d.promise;
    };

    return Data;
  }]);
