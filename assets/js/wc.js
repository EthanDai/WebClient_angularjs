'use strict';

(function(window) {

  var WebClientApp = angular.module('WebClientApp', ['ui']);



  window.WebClientCtrl = function($scope, $http, player) {
    $scope.player = player;
    $http.get('albums.json').success(function(data) {
      $scope.albums = data;
      player.notice = "choose your playlist...";
    });



  };

  //angular.bootstrap(window, ['WebClientApp']);

  WebClientApp.factory('player', function(audio, $rootScope, $http) {
    var player,
        playlist = [],
        paused = false,
        current = {
          album: 0,
          track: 0
        };

    player = {

      playlist: playlist,

      current: current,

      playing: false,

      showNotice : "",

      play: function(track) {

        if (!playlist.length) return;

        if (angular.isDefined(track)) current.track = track;

        if (!paused) audio.src = playlist[0].tracks[current.track].url;
        audio.play();
        player.playing = true;
        paused = false;
      },

      pause: function() {
        if (player.playing) {
          audio.pause();
          player.playing = false;
          paused = true;
        }
      },

      reset: function() {
        player.pause();
        current.album = 0;
        current.track = 0;
      },

      next: function() {
        if (!playlist.length) return;
        paused = false;
        if (playlist[0].tracks.length > (current.track + 1)) {
          current.track++;
        } else {
          current.track = 0;
        }
        if (player.playing) player.play();
      },

      previous: function() {
        if (!playlist.length) return;
        paused = false;
        if (current.track > 0) {
          current.track--;
        } else {
          current.track = playlist[0].tracks.length - 1;
        }
        if (player.playing) player.play();
      }
    };

    playlist.change = function(album, player ,$scope) {

      if (playlist.indexOf(album) != -1) return;

      $http.get('track_'+album.id+'.json').success(function(data) {
          playlist[0]   = data;
          playlist[0].cover = album.cover;
      });

      player.reset();
      
      player.notice = "1. double click song name to change this music <br>" + 
                      "2. drap & drop to sort playlist and song" ; 
      player.current.album = album.id;

      //console.log(player.current.album);

    };


    audio.addEventListener('ended', function() {
      $rootScope.$apply(player.next);
    }, false);

    return player;
  });


  // extract the audio for making the player easier to test
  WebClientApp.factory('audio', function($document) {
    var audio = $document[0].createElement('audio');
    return audio;
  });

})(window);