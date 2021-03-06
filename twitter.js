// Generated by CoffeeScript 1.8.0
var $, OAuth, ab64, async, consumerSecret, consumer_key, exports, gui, twitter_req;

exports = module.exports = {};

ab64 = 'QWJHZkNEOWJxWXBLcDBtYmtqTVF2QTJRWWxnWlZlUGNuZHcwMkxvOHBYSmdpVDk2WHk=';

consumer_key = '8CMdYgIYpDM6uknWRAfWEhGEj';

consumerSecret = new Buffer(ab64, 'base64').toString('utf8');

OAuth = require('oauth').OAuth;

twitter_req = require('twitter-request');

async = require('async');

$ = require('jquery');

gui = window.require('nw.gui');

exports.destroy = function(boxContentId, session, api) {
  if (session.twitter[boxContentId].update_stream) {
    session.twitter[boxContentId].update_stream.removeAllListeners('data');
  }
  api.removeAllContent('trickle-twitter', boxContentId);
  return delete session.twitter[boxContentId];
};

exports.init = function(content_id, config_id, session, api) {
  var authenticate, awaiting_config, createTweetStream, get_stream, oauth, print_tweets, setLightboxEvent, streamBuffer;
  awaiting_config = false;
  if (!session.twitter) {
    session.twitter = {};
  }
  if (!session.twitter[content_id]) {
    session.twitter[content_id] = {};
  }
  oauth = new OAuth("https://api.twitter.com/oauth/request_token", "https://api.twitter.com/oauth/access_token", consumer_key, consumerSecret, "1.0", "oob", "HMAC-SHA1");
  authenticate = function(callback) {
    awaiting_config = true;
    $(config_id).html(api.icon.spinning("refresh") + "Initializing...");
    return oauth.getOAuthRequestToken(function(error, user_token, user_secret, results) {
      var link, query_html, snipid;
      session.twitter.user_token = user_token;
      session.twitter.user_secret = user_secret;
      link = 'https://twitter.com/oauth/authenticate?oauth_token=' + user_token;
      snipid = config_id.slice(1);
      query_html = "<div class=\"form-group\">\n    <label>Please visit the following Link and enter the PIN.<br>\n    <a id=\"twitter-link-" + snipid + "\">Click me</a><br></label>\n    <input type=\"number\" class=\"form-control\" id=\"twitter-input-" + snipid + "\" placeholder=\"PIN\">\n</div>\n<button class=\"btn btn-default\" id=\"twitter-pin-" + snipid + "\">Submit</button>";
      $(config_id).html(query_html);
      $("#twitter-link-" + snipid).click(function() {
        return gui.Shell.openExternal(link);
      });
      return $("#twitter-pin-" + snipid).click(function() {
        var PIN;
        PIN = $("#twitter-input-" + snipid).val();
        $(config_id).html(api.icon.spinning("refresh") + "Validating PIN...");
        return oauth.getOAuthAccessToken(user_token, user_secret, PIN, function(error, oauth_access_token, oauth_access_token_secret, results) {
          if (error) {
            $(config_id).html(api.icon("close") + "An error occured.");
            console.log(error);
            return awaiting_config = false;
          } else {
            $(config_id).html(api.icon.spinning("refresh") + "Loading Tweets...");
            session.twitter.access_token = oauth_access_token;
            session.twitter.access_secret = oauth_access_token_secret;
            awaiting_config = false;
            return callback(null, oauth_access_token);
          }
        });
      });
    });
  };
  get_stream = function(callback) {
    var query, readyoauth, treq;
    $(config_id).html(api.icon("check") + "Everything worked. You can close the config now.");
    readyoauth = {
      consumer_key: consumer_key,
      consumer_secret: consumerSecret,
      token: session.twitter.access_token,
      token_secret: session.twitter.access_secret
    };
    treq = new twitter_req(readyoauth);
    if (!session.twitter[content_id].last_id) {
      session.twitter[content_id].last_id = 1;
    }
    query = {
      since_id: session.twitter[content_id].last_id,
      count: 100
    };
    return treq.request('statuses/home_timeline', {
      query: query
    }, function(err, res, body) {
      var result;
      if (err) {
        console.log("Error: " + err);
      } else {
        result = JSON.parse(body);
        if (result.length < 1) {
          callback("No new tweets");
        } else {
          callback(null, body);
        }
      }
      return createTweetStream();
    });
  };
  print_tweets = function(err, result) {
    var cnt, e, image_id, pic_height, picture, text, tweet, tweet_entry, tweets, user_img, _i, _j, _len, _len1, _ref, _ref1, _results;
    if (err) {
      return console.log(err);
    } else {
      tweets = JSON.parse(result.tweets);
      if (tweets[tweets.length - 1]) {
        if (tweets[tweets.length - 1].id === session.twitter[content_id].last_id) {
          tweets.pop();
        }
      }
      if (tweets[0]) {
        session.twitter[content_id].last_id = Number(tweets[0].id);
      }
      try {
        _ref = tweets.reverse();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tweet = _ref[_i];
          user_img = tweet.user.profile_image_url;
          tweet_entry = "<div class='row trickle-twitter' style=''>";
          if (tweet.retweeted_status) {
            text = tweet.retweeted_status.text.replace(/\n/g, "<br>");
            tweet_entry += "<div class='col-md-2'><img class='img-rounded img-small' src='" + tweet.retweeted_status.user.profile_image_url + "'></div>";
            tweet_entry += "<div class='col-md-10'><div class='row'><div class='col-md-12'><strong>" + tweet.retweeted_status.user.name + "</strong> <small>@" + tweet.retweeted_status.user.screen_name + " (retweeted by " + tweet.user.name + ")</small></div></div> ";
            tweet_entry += "<div class='row'><div class='col-md-12'>" + text + "</div></div>";
          } else {
            text = tweet.text.replace("\n", "<br>");
            tweet_entry += "<div class='col-md-2'><img class='img-rounded 'src='" + user_img + "'></div>";
            tweet_entry += "<div class='col-md-10'><div class='row'><div class='col-md-12'><strong>" + tweet.user.name + "</strong> <small>@" + tweet.user.screen_name + "</small></div></div> ";
            tweet_entry += "<div class='row'><div class='col-md-12'>" + text + "</div></div>";
          }
          tweet_entry += "</div>";
          if (tweet.extended_entities) {
            _ref1 = tweet.extended_entities.media;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              picture = _ref1[_j];
              cnt = 1;
              image_id = 'twitter-image-' + tweet.id + content_id.slice(1) + cnt;
              pic_height = picture.sizes.medium.h;
              if (pic_height > 300) {
                pic_height = (pic_height - 300) / 2;
              } else {
                pic_height = 0;
              }
              tweet_entry += "<div class='row'> <div class='col-md-12 img-divider'>" + api.icon('asterisk') + "</div></div>";
              tweet_entry += "<div class='row'> <div class='col-md-12 img-wrapper'><img class='img-rounded img-responsive center-block twitter-image' id='" + image_id + "' src='" + picture.media_url + "' style='margin-top: -" + pic_height + "px;'></div> </div>";
            }
          }
          tweet_entry += "<div class='row' style='margin-right: 0.5em;'>";
          tweet_entry += "<div class='col-md-12 col-bottom'></div></div>";
          api.postContent(tweet_entry, content_id);
          if (tweet.entities.media) {
            _results.push(setLightboxEvent('#' + image_id));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      } catch (_error) {
        e = _error;
        console.log(e);
        return console.log("Tweet unreadable (probably Limit exceeded)");
      }
    }
  };
  setLightboxEvent = function(selector) {
    $("" + selector).unbind('click');
    return $("" + selector).click(function() {
      var content, src;
      src = $(this).prop('src');
      content = "<img src='" + src + "'> ";
      return api.lightbox(content);
    });
  };
  $(".twitter-image").each(function(index) {
    return setLightboxEvent('#' + $(this).prop('id'));
  });
  streamBuffer = "";
  createTweetStream = function() {
    var query, readyoauth, treq, update_stream;
    readyoauth = {
      consumer_key: consumer_key,
      consumer_secret: consumerSecret,
      token: session.twitter.access_token,
      token_secret: session.twitter.access_secret
    };
    treq = new twitter_req(readyoauth);
    query = {
      'with': 'followings'
    };
    update_stream = treq.request('user', {
      body: query
    });
    update_stream.on('data', function(data) {
      var end, result, tweet;
      end = data.toString().slice(-2);
      streamBuffer += data.toString();
      if (end === '\r\n') {
        try {
          tweet = JSON.parse(streamBuffer);
          if (tweet.text) {
            result = {
              tweets: "[" + streamBuffer + "]"
            };
            print_tweets(null, result);
          }
        } catch (_error) {}
        return streamBuffer = "";
      }
    });
    return session.twitter[content_id].update_stream = update_stream;
  };
  if (!session.twitter.access_token || !session.twitter.access_secret) {
    return async.series({
      auth: authenticate,
      tweets: get_stream
    }, print_tweets);
  } else {
    return async.series({
      tweets: get_stream
    }, print_tweets);
  }
};
