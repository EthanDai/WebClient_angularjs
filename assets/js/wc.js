'use strict';

(function(window) {

    var WebClientApp = angular.module('WebClientApp', ['ui']);

    WebClientApp.controller('WebClientCtrl', ['$scope', '$http', 'player', function($scope, $http, player) {
        
        $http.get('api/get_albums.json').success(function(data) {
          $scope.albums = data;
          player.notice = "choose your playlist...";
        });
        $scope.player = player;

        var updatePlayer = function () {
             $scope.player = player;
        }

    }]);

    //angular.bootstrap(window, ['WebClientApp']);

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

            showNotice : "",

            play: function(track) {

                if (!playlist.length) return;

                if (angular.isDefined(track)) current.track = track;

                $('#kkbox_player').jPlayer("setMedia", {mp3: playlist[0].tracks[current.track].url}).jPlayer("play");
            }
        };

        playlist.reset = function() {
              player.current.album = 0;
              player.current.track = 0;
        }

        playlist.change = function(album, player ,$scope) {

          if (playlist.indexOf(album) != -1) return;

          $http.get('api/get_track_'+album.id+'.json').success(function(data) {

              playlist[0]   = data;
              playlist[0].cover = album.cover;
              player.current.album = album.id;
              playlist.reset();
              player.notice = "1. double click song name to change this music <br>" + 
                              "2. drap & drop to sort playlist and song" ; 

              // 將歌曲帶給 jplayer
              $('#kkbox_player').jPlayer("setMedia", {mp3: playlist[0].tracks[current.track].url});            
          });

          //console.log(player.current.album);

        };


        return player;
    });





    WebClientApp.directive('jplayer', ['player',  function(player) {
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
                      play:"#palyBtn", 
                      pause:"#pauseBtn",
                      stop: "#stopBtn",
                      seekBar: "#seekBar",
                      playBar: "#playBar",
                      volumeBar: "#volumBar",
                      volumeBarValue: "#volumValueBar",
                      mute: "#muteBtn",
                      unmute: "#volumDownBtn",
                      volumeMax:"#volumMaxBtn",
                      currentTime: "#currentTime",
                      duration: "#duration",
                      repeat: "#repeatBtn",
                      repeatOff: "#repeatOffBtn",
                      noSolution: ".jp-no-solution"                                                  
                      
                  },            
                  ready: function () {

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

                      if(event.jPlayer.options.loop) {
                          playerObj.jPlayer("play");
                      }else{
                          if (!player.playlist.length) return;

                          if (player.playlist[0].tracks.length > (player.current.track + 1)) {
                              player.current.track++;
                          } else {
                              player.current.track = 0;
                          }

                          playerObj.jPlayer("setMedia", {mp3: player.playlist[0].tracks[player.current.track].url}).jPlayer("play");

                          scope.$apply(updatePlayer);
                      }


                  }
                });
              };
     
              //scope.$watch(attrs.audio, updatePlayer);


              updatePlayer();
            }
          };
     }]);

    WebClientApp.directive('popover', ['player',  function(player) {
          return {
            restrict: 'A',
            link: function(scope, element, attrs) {
              element.popover();
            }
          };
     }]);    
    

})(window);