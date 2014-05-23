// NOTE / TODO :
// Constants are used for dependency injecton of 3rd party JS libs.
// Although these *currently* exist as global objects,
//  they should eventually be pulled in by a module loader and removed from the global namespace.

angular.module('wmProfile.services', [])
  .constant('MakeAPI', window.Make)
  .constant('jQuery', window.$)
  .constant('WebmakerAuthClient', window.WebmakerAuthClient)
  .factory('userService', ['$resource', '$q',
    function ($resource, $q) {
      var userAPI = $resource('/user/user-data/:username', {
        username: '@username'
      });

      var userData;

      return {
        getUserData: function (username) {
          var deferred = $q.defer();

          if (userData) {
            deferred.resolve(userData);
          } else {
            userAPI.get({
              username: username
            }, function (data) {
              userData = data;
              deferred.resolve(userData);
            }, function (err) {
              console.error('User ' + username + ' doesn\'t exist.');
              deferred.reject(err);
            });
          }

          return deferred.promise;
        }
      };
    }
  ])
  .factory('loginService', ['$rootScope', 'WebmakerAuthClient',
    function ($rootScope, WebmakerAuthClient) {
      var visitorData;
      var auth = new WebmakerAuthClient({
        paths: {
          authenticate: '/user/authenticate',
          checkUsername: '/user/checkUsername',
          create: '/user/create',
          logout: '/user/logout',
          verify: '/user/verify',
        }
      });

      auth.on('login', function (user, debuggingInfo) {
        visitorData = user;
        $rootScope.$broadcast('userLoggedIn', visitorData);
      });

      auth.on('logout', function () {
        visitorData = undefined;
        $rootScope.$broadcast('userLoggedOut');
      });

      auth.on('error', function (errorMessage) {
        console.error(errorMessage);
      });

      auth.verify();

      return {
        login: function () {
          auth.login();
        },
        logout: function () {
          auth.logout();
        },
        getData: function () {
          return visitorData;
        }
      };
    }
  ])
  .factory('badgesService', ['$resource', '$q',
    function ($resource, $q) {
      var badgeAPI = $resource('/user/badges/username/:username', {
        username: '@username'
      });

      var badges;

      return {
        // Only do badges service call once and cache it
        getBadges: function (username) {
          var deferred = $q.defer();

          if (badges) {
            deferred.resolve(badges);
          } else {
            badgeAPI.query({
              username: username
            }, function (data) {
              badges = data;
              deferred.resolve(badges);
            }, function (err) {
              deferred.reject(err);
            });
          }

          return deferred.promise;
        }
      };

    }
  ])
  .factory('eventService', ['$rootScope', '$resource',
    function ($rootScope, $resource) {
      return $resource($rootScope.WMP.config.eventService + '/events/:id', {
        organizerId: '@organizerId',
        after: '@after'
      }, {
        update: {
          method: 'PUT'
        }
      });
    }
  ])
  .factory('makeapi', ['$rootScope', '$resource', 'MakeAPI',
    function ($rootScope, $resource, MakeAPI) {
      var makeapi = new MakeAPI({
        apiURL: $rootScope.WMP.config.makeAPI
      });

      // Massage make data for easier consumption in view
      makeapi.massage = function (makes) {
        makes.forEach(function (make, index) {
          makes[index].likeCount = make.likes.length;
        });

        return makes;
      };

      return makeapi;
    }
  ]);
