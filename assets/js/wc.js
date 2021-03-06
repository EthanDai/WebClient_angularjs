'use strict';

(function(window) {

  var WebClientApp = angular.module('WebClientApp', ['ui']);

  //Set up our mappings between URLs, tempaltes. and  controllers

  function RouteConfig($routeProvider) {
    $routeProvider.

    // Notice that for the detail view, we specify a parameterized URL component by placing a colon in front of the id
    when('/album/:album_id', {
      controller: 'AlbumCtrl',
      templateUrl: 'partials/album.html'
    })
  };

  //Set up our route so the AMailservice can find it
  WebClientApp.config(RouteConfig);

  // WebClinet controller 
  WebClientApp.controller('WebClientCtrl', ['$scope', '$http', 'player', 'ui_info', 'album_info', 'user_info', 'page_ui',
    function($scope, $http, player, ui_info, album_info, user_info, page_ui) {

      // 讀取預設使用者播放清單
      $http.get('api/get_playlist.json').success(function(data) {
        for (var i = 0; i < data.length; i++) {
          user_info.playlist.push({
            id: data[i].id,
            title: data[i].title,
            artist: data[i].artist,
            cover: data[i].cover,
            tracks: data[i].tracks,
            shuffle_tracks: user_info.shufflePlayList(data[i].tracks)
          });
        }
      });

      


      $scope.player = player;
      $scope.ui_info = ui_info;
      $scope.album_info = album_info;
      $scope.user_info = user_info;
      player.notice = "choose your playlist...";

      /*
      var updatePlayer = function() {
        $scope.player = player;
      }
      */

      // 切換主 function 要做的事
      $scope.switchFunc = function(func_name) {

        switch (func_name) {
          case 'playlist':
            ui_info.atPlayList = true;
            page_ui.goto_main_page('main_div');
            //console.log('change ui_info.atPlayList:' + ui_info.atPlayList);
            break;
        }

        ui_info.current_func = func_name;

      }


}]);

  // Search Controller
  WebClientApp.controller('SearchCtrl', ['$scope', '$http', 'album_info', 'ui_info', '$compile', 'page_ui',
    function($scope, $http, album_info, ui_info, $compile, page_ui) {

      $http.get('api/search_data.json').success(function(data) {
        $scope.searchAlbums = data;
      });


      if (page_ui.current_idx == 0) {
        // 指定初始頁面
        page_ui.add_main_page('main_div', 'main_page');
      }

      $scope.showList = function(id) {
        

        ui_info.atPlayList = false;
        ui_info.current_func = 'search';


        $.get("api/get_album.php?id=" + id, function(data) {
            page_ui.add_page('main_div', data, id);
        });

        // 關閉 search popup
        $('#fun_search_btn').popover('hide');

        //$('.sliderLink').pageslide({ direction: 'left', href: 'partials/album_list.html'});
      }

    }
  ]);


  //angular.bootstrap(window, ['WebClientApp']);

  // 提供紀錄 ui 相關設定的 service
  WebClientApp.factory('user_info', ['$rootScope', '$http', 'ui_info', 'player',
    function($rootScope, $http, ui_info, player) {



      var user_info = {

        right_click_obj: "",
        current: {
          playlist_id: 0
        },
        playlist: [],

        del_track: function() {
          player.playlist.del_track(user_info.right_click_obj);
        },
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
                  tracks: data[i].tracks,
                  shuffle_tracks: user_info.shufflePlayList(data[i].tracks)
                });

                // 紀錄現在播放清單編號
                user_info.current.playlist_id = user_info.playlist.length - 1;
                // 切換回播放清單
                user_info.changePlaylist(user_info.current.playlist_id, player);
              }

            }

          });



        },
        changePlaylist: function(album_id, player) {
          ui_info.atPlayList = true;
          ui_info.current_func = 'playlist';
          player.playlist.change(user_info.playlist[album_id], player);
        },
        shufflePlayList: function(tracks){

          var shffleTracks = tracks.slice(0);
          // var shffleTracks = jQuery.extend(true, {}, tracks); //object deep clone
          shffleTracks.sort(function(){return Math.random()>0.5?-1:1;});
          //console.log(shffleTracks);
          return shffleTracks;
        }

      }

      return user_info;
    }
  ]);
  
  // 歌詞 service
  WebClientApp.factory('lyrics', function($rootScope, $http) {

    var lyrics_info = {
      container:'lyrics_div',
      container_height:200,
      lyrics_data:[],
      load_data: function(song_id){
        $http.get('api/get_lyrics.json').success(function(data) {

            lyrics_info.lyrics_data = data.lyrics;

            lyrics_info.clear_lyrics_content(lyrics_info.container);
            lyrics_info.create_lyrics_content(lyrics_info.container, lyrics_info.lyrics_data);
        });
      },
      create_lyrics_content: function(container, lyrics_data){
        for(var i=0; i<lyrics_data.length; i++){
             $('#'+container).append('<li id="lyrics_'+i+'"><a>'+lyrics_data[i].content+'</a></li>');
        }
        $('#lyrics_div').scrollTop(0);
       
      },
      clear_lyrics_content: function(container){
        $('#'+container).html('');

      },
      hightline_lyrics: function(nowPlayTime){

        var height = 0;

        for(var i =0; i<lyrics_info.lyrics_data.length; i++){
         
          height += $("#lyrics_"+i).height();

          if(nowPlayTime >= lyrics_info.lyrics_data[i].start_time && nowPlayTime < lyrics_info.lyrics_data[i].end_time){  

            $("#lyrics_"+i).attr("class", "active");
            
            // 調整 scroll 位置，避免highline歌詞看步道(讓歌詞顯示在中間)
            $('#'+lyrics_info.container).scrollTop(height-(lyrics_info.container_height/2));
            //$('#lyrics_div').scrollTo("#lyrics_"+i);

              
          }
          else
            $("#lyrics_"+i).attr("class", "");
        }        
      }

    }

    return lyrics_info;
  });

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
      track: 0,
      song: {},
      repeatMode: 0, // 0:no repeat, 1:song repeat, 2:playlist repeat
      playMode: 0,   // 0:normal, 1:random mode
    };

    player = {

      playlist: playlist,

      current: current,

      showNotice: "",

      play: function(track) {

        if (!playlist.length) return;

        if (angular.isDefined(track)) current.track = track;

        current.song = playlist[0].tracks[current.track];

        $('#kkbox_player').jPlayer("setMedia", {
          mp3: playlist[0].tracks[current.track].url
        }).jPlayer("play");
      }
    };

    playlist.reset = function() {
      player.current.album = 0;
      player.current.track = 0;
      player.current.song ={};

    }

    playlist.del_track = function(track_id) {
      playlist[0].tracks.splice(track_id, 1);
    }

    playlist.change = function(data, player, $scope) {

      playlist[0] = data;
      playlist.reset();
      current.album = data.id;
      current.song = playlist[0].tracks[current.track];

      player.notice = "1. double click song name to change this music <br>" +
        "2. drap & drop to sort playlist and song";



      // 將歌曲帶給 jplayer
      $('#kkbox_player').jPlayer("setMedia", {
        mp3: playlist[0].tracks[current.track].url
      });

      //console.log(player.current.album);

    };
    return player;
  });

  
  // jplayer jQuert Plugin directive
  WebClientApp.directive('jplayer', ['player', '$http', 'lyrics', 
    function(player, $http, lyrics) {
      return {
        restrict: 'A',
        template: '<div id="kkbox_player"></div>',
        link: function(scope, element, attrs) {
          
          var playerObj = element.children('div')
          var play_status = "play";

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
                repeat: "#repeatBtn",       // 不使用，不符合需求，另刻
                repeatOff: "#repeatOffBtn",  // 不使用，不符合需求，另刻
                noSolution: ".jp-no-solution"
              },
              ready: function() {

                // 播放模式
                switch(player.current.playMode){
                  case 1:
                    $("#shuffleBtn").show();
                    $("#normalBtn").hide();
                    break;
                  default:
                    $("#shuffleBtn").hide();
                    $("#normalBtn").show();  
                    break;              
                }

                // 循環模式
                switch(player.current.repeatMode){
                  case 1:
                    $("#noRepeatBtn").hide();
                    $("#repeatBtn").show();
                    $("#repeatListBtn").hide();
                    break;
                  case 2:
                    $("#noRepeatBtn").hide();
                    $("#repeatBtn").hide();
                    $("#repeatListBtn").show();
                    break;                    
                  default:
                    $("#noRepeatBtn").show();
                    $("#repeatBtn").hide();
                    $("#repeatListBtn").hide(); 
                    break;              
                }
               
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
              canplay: function(){
                // loading 歌詞
                lyrics.load_data(player.current.song.id);
              },
              timeupdate: function(event){
                
                var now_mico_time = event.jPlayer.status.currentTime*1000;
                lyrics.hightline_lyrics(now_mico_time);
                /*
                if (event.jPlayer.status.currentTime > 60) {
                   $(this).jPlayer('stop');
                }
                */
              },
              durationchange: function(){
                //console.log(play_status);
                // 因為 stop 的動作無法在 ended 裡執行(jplayer官方的bug)
                // 所以在每次換歌要播放前來判斷是否要循環
                if("stop" == play_status)
                  playerObj.jPlayer(play_status);

              },
              ended: function(event) {

                play_status = "play";

                if(1 == player.current.repeatMode){
                  playerObj.jPlayer("play");
                }
                else {

                  var play_song_url = "";
                 

                  if (!player.playlist.length) return;

                 
                  if(player.current.playMode==1){ // 隨機模式

                    if (player.playlist[0].tracks.length > (player.current.track + 1)) {  // 尚未播到最後一首

                      player.current.track++;
                     
                    } else {

                      player.current.track = 0;
                      if(0 == player.current.repeatMode){
                        play_status = "stop";
                      }
                    }
                    
                    play_song_url = player.playlist[0].shuffle_tracks[player.current.track].url;
                    player.current.song = player.playlist[0].shuffle_tracks[player.current.track];

                  }else{ // 一般模式
 
                    if (player.playlist[0].tracks.length > (player.current.track + 1)) {  // 尚未播到最後一首
                      player.current.track++;
                    } else {
                     
                      player.current.track = 0;
                      if(0 == player.current.repeatMode){
                        play_status = "stop";
                      }                       
                    }

                    play_song_url = player.playlist[0].tracks[player.current.track].url;
                    player.current.song = player.playlist[0].tracks[player.current.track]

                  }                  
    
                  // 播放
                  playerObj.jPlayer("setMedia", {
                    mp3: play_song_url
                  }).jPlayer(play_status);   


                  scope.$apply(updatePlayer);
                }


              }
            });
          };

          // 切換為隨機模式
          $("#normalBtn").click(function(){

            player.current.playMode = 1;
            $(this).hide();
            $("#shuffleBtn").show();

          });

          // 切換為一般模式
          $("#shuffleBtn").click(function(){

             player.current.playMode = 0;
            $(this).hide();
            $("#normalBtn").show();

          });

          // 切換為單曲重復
          $("#noRepeatBtn").click(function(){

             player.current.repeatMode = 1;
            $(this).hide();
            $("#repeatBtn").show();
            $("#repeatListBtn").hide();

          });

           // 切換為歌單重復
          $("#repeatBtn").click(function(){

             player.current.repeatMode = 2;
            $(this).hide();
            $("#noRepeatBtn").hide();
            $("#repeatListBtn").show();

          });         

           // 切換為無重復
          $("#repeatListBtn").click(function(){

            player.current.repeatMode = 0
            $(this).hide();
            $("#noRepeatBtn").show();
            $("#repeatBtn").hide();

          });  


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
              if (!target.is(".popover") && !target.parents().is(".popover") && !target.is(element)) {
                element.popover('hide');
              }
            });

          });
        }
      };
    }
  ]);


  WebClientApp.directive('context', ['user_info',
    function(user_info) {
      return {
        restrict: 'A',
        scope: '@&',
        compile: function compile(tElement, tAttrs, transclude) {


          return {

            post: function postLink(scope, iElement, iAttrs, controller) {
              var ul = $('#' + iAttrs.context),
                last = null;

              ul.css({
                'display': 'none'
              });


              document.oncontextmenu = function(e) {
                if (e.target.parentElement.hasAttribute('context')) {
                  return false;
                }

              };

              iElement.bind('contextmenu', function(e) {


                user_info.right_click_obj = iAttrs.trackid;

                ul.css({
                  position: "absolute",
                  display: "block",
                  left: event.clientX + 'px',
                  top: (event.clientY - 25) + 'px'
                });

              });



              $(document).click(function(event) {

                ul.css({
                  'display': 'none'
                });
              });

            }
          };
        }
      };
    }
  ]);

  WebClientApp.directive('rightClick', function() {

    document.oncontextmenu = function(e) {
      if (e.target.hasAttribute('right-click')) {
        return false;
      }
    };

    return function(scope, el, attrs) {
      el.bind('contextmenu', function(e) {


      });
    }
  });


  // 提供紀錄 ui 相關設定的 service
  WebClientApp.factory('page_ui', ['$rootScope', '$http', '$compile', 'user_info',
    function($rootScope, $http, $compile, user_info) {

      var page_ui = {
        current_idx: 0, // 目前控制的 page id
        show_width: 350, // 要露出的pre page 寬度
        move_dis: 2000, // 新的page移動的距離，越大越順
        speed: 500, // 每次移動要花的時間 1000 = 1 sec
        pages: [], // 所有page的基本資料array
        add_main_page: function(container, name) {

          var page_info = {
            id: page_ui.current_idx,
            name: name,
            top: 0,
            left: 0,
            next_id: (page_ui.current_idx + 1)

          }

          $("#" + name).css('background-color', page_info.color)
            .css('position', 'absolute')
            .css('top', page_info.top + 'px')
            .css('height', '800px')
            .click(function() {

              // 有上一層才刪除
              if ($('#page' + page_info.next_id).length > 0) {
                // 移除前一個
                $('#page' + page_info.next_id).animate({
                  left: "+=" + (page_ui.move_dis - page_ui.show_width)
                }, page_ui.speed, function() {
                  page_ui.reset_mask();
                  $('#page' + page_info.next_id).remove();

                });


                page_ui.pages.splice((page_ui.current_idx - 1), 1);
                page_ui.current_idx--;

                if (page_ui.pages.length > 1) {
                  // 位置設定完移動主框架
                  $("#" + container).animate({
                    left: "+=" + page_ui.show_width,
                  }, page_ui.speed, function() {
                    // Animation complete.

                  });

                }
              }
            });

          page_ui.pages.push(page_info);
          page_ui.current_idx++;
        },
        add_mask: function() {

          $("#" + page_ui.pages[page_ui.current_idx - 2].name).css('opacity', '0.5');
        },
        reset_mask: function() {

          $("#" + page_ui.pages[page_ui.current_idx - 1].name).css('opacity', '1');

        },
        add_page: function(container, html_page, album_id) { // 新增一頁

          var page_info = {
            id: page_ui.current_idx,
            name: 'page' + page_ui.current_idx,
            top: 0,
            left: 0,
            next_id: (page_ui.current_idx + 1)

          }

          var template_html = $.trim(html_page);
          var compile_html = $compile(template_html)($rootScope);

          // 新增page
          var new_page = $('<div></div>').attr("class", 'row-fluid')
            .attr("id", page_info.name)
            .css("padding-right", "250px")
            .css('position', 'absolute')
            .css('top', page_info.top + 'px')
            .css('background-color', 'white')
            .css('height', '800px')
            .click(function() {
              // 有上一層才刪除
              if ($('#page' + page_info.next_id).length > 0) {

                // 移除前一個
                $('#page' + page_info.next_id).animate({
                  left: "+=" + (page_ui.move_dis - page_ui.show_width)
                }, page_ui.speed, function() {
                  $('#page' + page_info.next_id).remove();
                  page_ui.reset_mask();

                });


                page_ui.pages.splice((page_ui.current_idx - 1), 1);

                page_ui.current_idx--;

                if (page_ui.pages.length > 1) {
                  // 位置設定完移動主框架
                  $("#" + container).animate({
                    left: "+=" + page_ui.show_width,
                  }, page_ui.speed/2, function() {
                    // Animation complete.

                  });

                }
              }
            }).append(compile_html);



          // 將新頁資訊紀錄
          page_ui.pages.push(page_info);

          $(new_page).appendTo('#' + container);
          $('#'+page_info.name+" #addBtn").click(function(){

            user_info.addPlaylist(album_id);
            page_ui.goto_main_page(container);
            //alert(page_info.name);
          });

          if (page_ui.pages.length > 1) {
            $("#" + page_info.name).css('left', ((page_ui.move_dis - page_ui.show_width) + (page_ui.show_width * page_ui.current_idx)) + 'px');
          }

          // 調整之前page位置
          for (var i = 0; i < page_ui.pages.length; i++) {

            var control_obj = $("#" + page_ui.pages[i].name);


            if (page_ui.pages.length == 1) {

              // 第一層不做移動，待有第三層出現時再行處理
            } else if (page_ui.pages.length == 2) {
              if (i == 1) {
                // 有兩層時，第一層不移動，僅移動第2層
                control_obj.animate({
                  left: "-=" + (page_ui.move_dis - page_ui.show_width),
                }, page_ui.speed, function() {
                  // Animation complete.
                  page_ui.add_mask();
                });
              }

            } else {

              // 超過三層後，所有東西連動移動
              if (i == (page_ui.pages.length - 1)) {

                control_obj.animate({
                  left: "-=" + (page_ui.move_dis - page_ui.show_width)
                }, page_ui.speed, function() {
                  // Animation complete.
                  page_ui.add_mask();
                });
              } else {
                // 看不到的 page直接到位，不做動畫移動
                control_obj.css('left', page_ui.show_width * i);
              }
            }

          }

          if (page_ui.pages.length > 2) {

            // 位置設定完移動主框架
            $("#" + container).animate({
              left: "-=" + page_ui.show_width //700 or page_ui.show_width
            }, page_ui.speed/2, function() {
              // Animation complete.
            });

          }

          page_ui.current_idx++;
          //console.log(page_ui.current_idx);
        },
        goto_main_page: function(container) { // 刪除所有分頁，顯示歌單頁

            var total_length = page_ui.pages.length-2;
             for(var i = (page_ui.pages.length-1); i > 0; i--){

                  $('#page' + page_ui.pages[i].id).remove();
                  page_ui.pages.splice((page_ui.current_idx - 1), 1);
                  page_ui.current_idx--;
                  page_ui.reset_mask();
             }

             if(total_length>0)
             {
                // 位置設定完移動主框架
                $("#"+container).animate({
                  left: "+=" + page_ui.show_width*total_length,
                }, page_ui.speed, function() {
                  // Animation complete.

                });              
             }

        }
      };

      return page_ui;
    }
  ]);

})(window);