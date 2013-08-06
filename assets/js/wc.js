'use strict';

(function(window) {

  var WebClientApp = angular.module('WebClientApp', ['ui']);

  // WebClinet controller 
  WebClientApp.controller('WebClientCtrl', ['$scope', '$http', 'player', 'ui_info', 'album_info', 'user_info',
    function($scope, $http, player, ui_info, album_info, user_info) {

      // 讀取預設使用者播放清單
      $http.get('api/get_playlist.json').success(function(data) {
        user_info.playlist = data;
      });


      $scope.player = player;
      $scope.ui_info = ui_info;
      $scope.album_info = album_info;
      $scope.user_info = user_info;
      player.notice = "choose your playlist...";

      var updatePlayer = function() {
        $scope.player = player;
      }

      // 切換主 function 要做的事
      $scope.switchFunc = function(func_name) {

        switch (func_name) {
          case 'playlist':
            ui_info.atPlayList = true;
            console.log('change ui_info.atPlayList:' + ui_info.atPlayList);
            break;
        }

        ui_info.current_func = func_name;

      }


    }
  ]);

  // Search Controller
  WebClientApp.controller('SearchCtrl', ['$scope', '$http', 'album_info', 'ui_info',
    function($scope, $http, album_info, ui_info) {

      $http.get('api/search_data.json').success(function(data) {
        $scope.searchAlbums = data;
      });

      $scope.showList = function(id) {
        ui_info.atPlayList = false;
        ui_info.current_func = 'search';
        for (var i = 0; i < $scope.searchAlbums.length; i++) {

          if (id == $scope.searchAlbums[i].id) {
            album_info.id = $scope.searchAlbums[i].id;
            album_info.title = $scope.searchAlbums[i].title;
            album_info.artist = $scope.searchAlbums[i].artist;
            album_info.cover = $scope.searchAlbums[i].cover;
            album_info.tracks = $scope.searchAlbums[i].tracks;
            // 關閉 search popup
            $('#fun_search_btn').popover('hide');

          }
        }

        //$('.sliderLink').pageslide({ direction: 'left', href: 'partials/album_list.html'});
      }

    }
  ]);


  //angular.bootstrap(window, ['WebClientApp']);

  // 提供紀錄 ui 相關設定的 service
  WebClientApp.factory('user_info', ['$rootScope', '$http', 'ui_info', 'player',
    function($rootScope, $http, ui_info, player) {



      var user_info = {

        playlist: [],

        addPlaylist: function(album_id) {

          // 判斷是否已加入該id
          for (var i = 0; i < user_info.playlist.length; i++) {
            if (album_id == user_info.playlist[i].id) {
              // 已存在...不加入
              alert('you add this before...');
              return;
            }
          }


          // 判斷 album_id 是否存在，存在就加入
          $http.get('api/search_data.json').success(function(data) {

            for (var i = 0; i < data.length; i++) {
              if (album_id == data[i].id) {
                user_info.playlist.push({
                  id: data[i].id,
                  title: data[i].title,
                  artist: data[i].artist,
                  cover: data[i].cover,
                  tracks: data[i].tracks
                });

                // 切換回播放清單
                user_info.changePlaylist(album_id, player);
              }

            }

          });



        },
        changePlaylist: function(album_id, player) {
          ui_info.atPlayList = true;
          ui_info.current_func = 'playlist';
          player.playlist.change(album_id, player);
        }
      }

      return user_info;
    }
  ]);

  // 提供紀錄 ui 相關設定的 service
  WebClientApp.factory('ui_info', function($rootScope, $http) {
    var ui_info = {};
    var current_func = "playlist";

    ui_info = {
      current_func: current_func,
      atPlayList: true

    }
    return ui_info;
  });

  // 提供紀錄 user 目前切換到哪個  album 的 service
  WebClientApp.factory('album_info', function($rootScope, $http) {

    var album_info = {
      id: '',
      title: '',
      artist: '',
      cover: '',
      tracks: []
    }

    return album_info;
  });

  // 提供紀錄 player 相關的 service
  WebClientApp.factory('player', function($rootScope, $http) {
    var player = {};
    var playlist = [];
    var current = {
      album: 0,
      track: 0
    };

    player = {

      playlist: playlist,

      current: current,

      showNotice: "",

      play: function(track) {

        if (!playlist.length) return;

        if (angular.isDefined(track)) current.track = track;

        $('#kkbox_player').jPlayer("setMedia", {
          mp3: playlist[0].tracks[current.track].url
        }).jPlayer("play");
      }
    };

    playlist.reset = function() {
      player.current.album = 0;
      player.current.track = 0;
    }

    playlist.change = function(album_id, player, $scope) {



      $http.get('api/search_data.json').success(function(data) {

        for (var i = 0; i < data.length; i++) {
          if (album_id == data[i].id) {
            playlist[0] = data[i];
            playlist.reset();
            current.album = album_id;
            player.notice = "1. double click song name to change this music <br>" +
              "2. drap & drop to sort playlist and song";

            console.log(playlist);
            // 將歌曲帶給 jplayer
            $('#kkbox_player').jPlayer("setMedia", {
              mp3: playlist[0].tracks[current.track].url
            });

          }

        }

      });



      //console.log(player.current.album);

    };
    return player;
  });


  // jplayer jQuert Plugin directive
  WebClientApp.directive('jplayer', ['player',
    function(player) {
      return {
        restrict: 'A',
        template: '<div id="kkbox_player"></div>',
        link: function(scope, element, attrs) {
          var playerObj = element.children('div')

          var updatePlayer = function() {

            playerObj.jPlayer({
              // Flash fallback for outdated browser not supporting HTML5 audio/video tags
              // http://jplayer.org/download/
              swfPath: 'assets/js/jplayer/',
              supplied: 'mp3',
              solution: 'html, flash',
              preload: 'auto',
              wmode: 'window',
              cssSelectorAncestor: "", // Remove the ancestor css selector clause
              cssSelector: {
                play: "#palyBtn",
                pause: "#pauseBtn",
                stop: "#stopBtn",
                seekBar: "#seekBar",
                playBar: "#playBar",
                volumeBar: "#volumBar",
                volumeBarValue: "#volumValueBar",
                mute: "#muteBtn",
                unmute: "#volumDownBtn",
                volumeMax: "#volumMaxBtn",
                currentTime: "#currentTime",
                duration: "#duration",
                repeat: "#repeatBtn",
                repeatOff: "#repeatOffBtn",
                noSolution: ".jp-no-solution"
              },
              ready: function() {

              },
              play: function() {
                if (attrs.pauseothers === 'true') {
                  playerObj.jPlayer('pauseOthers');
                }
              },
              pause: function() {

              },
              stop: function() {

              },
              ended: function(event) {

                if (event.jPlayer.options.loop) {
                  playerObj.jPlayer("play");
                } else {
                  if (!player.playlist.length) return;

                  if (player.playlist[0].tracks.length > (player.current.track + 1)) {
                    player.current.track++;
                  } else {
                    player.current.track = 0;
                  }

                  playerObj.jPlayer("setMedia", {
                    mp3: player.playlist[0].tracks[player.current.track].url
                  }).jPlayer("play");

                  scope.$apply(updatePlayer);
                }


              }
            });
          };

          //scope.$watch(attrs.audio, updatePlayer);
          updatePlayer();
        }
      };
    }
  ]);


  WebClientApp.directive('popover', ['$http', '$compile',
    function($http, $compile) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {


          $http.get(attrs.url).success(function(data) {

            //var templateData = $compile(data)(scope);

            element.popover({
              html: true,
              content: function() {
                return data
              },
              placement: attrs.placement,
              trigger: 'manual'
            });


            element.click(function() {

              element.popover('toggle');
              // 將 content compile成 angularjs 能讀取的model
              $compile($('.popover').contents())(scope);

            });

            // click popover outside to hide popover
            $(document).click(function(event) {
              var target = $(event.target);
              if(!target.is(".popover") && !target.parents().is(".popover") && !target.is(element)) {
                  element.popover('hide');
              }
            });

          });
        }
      };
    }
  ]);

  WebClientApp.directive('contextMenu', ['$http', '$compile',
    function($http, $compile) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            console.log(element);
            element.contextMenu("rightClickMenu", {

              bindings: {

                'open': function(t) {

                  alert('Trigger was '+t.id+'\nAction was Open');

                },
                'delete': function(t) {

                  alert('Trigger was '+t.id+'\nAction was Delete');

                }

              }

            });
        }
      };
    }
  ]);  



})(window);