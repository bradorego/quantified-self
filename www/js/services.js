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
