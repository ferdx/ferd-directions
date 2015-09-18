var request = require('request');
var _ = require('underscore');
var toMarkdown = require('to-markdown');

module.exports = function(ferd) {

  ferd.listen(/directions from\s(.*)\sto\s(.*)/i, function(response) {
    var origin = response.match[1];
    var destination = response.match[2];

    var originMin = origin.replace(/\W/g, '+');
    var destinationMin = destination.replace(/\W/g, '+');

    var url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + originMin + '&destination=' + destinationMin;

    request(url, function (error, responser, body) {

      var result = JSON.parse(body);

      console.log(result);

      if(result.status === 'NOT_FOUND' || result.status === 'UNKNOWN_ERROR' || result.status === 'ZERO_RESULTS') {
        response.postMessage({
          as_user: true,
          text: 'No results found. Try being more specific.'
        });
      } else {
        var colorArray = [];
        var count = 0;

        colorText(result.routes[0].legs[0].steps, colorArray);

        var distance = result.routes[0].legs[0].distance.text;
        var duration = result.routes[0].legs[0].duration.text;

        var directions = [{
              'fallback': 'Directions',
              'text': 'Directions\n\nFrom: *' + origin + '* \nTo: *' + destination + '*\n\nDistance: *' + distance + '*\nDuration: *' + duration + '*\n',
              'color': '#000',
              'mrkdwn_in': ['text']
            }];

        _.each(result.routes[0].legs[0].steps, function(step) {
          if(count === result.routes[0].legs[0].steps.length-1) {
            directions.push({
            'fallback': 'Directions',
            'text': ':checkered_flag: ' + toMarkdown(step.html_instructions).replace(/\*\*/g,'*').replace(/<[^>]*>/g, '') + ' - ' + step.distance.text + '\n',
            'color': colorArray[count++],
            'mrkdwn_in': ['text']
            });
          } else {
            directions.push({
              'fallback': 'Directions',
              'text': (maneuvers[step.maneuver] || '') + ' ' + toMarkdown(step.html_instructions).replace(/\*\*/g,'*').replace(/<[^>]*>/g, '') + ' - ' + step.distance.text + '\n',
              'color': colorArray[count++],
              'mrkdwn_in': ['text']
            });
          }
        });

        if(directions.length > 35) {
          response.postMessage({
            as_user: true,
            text: 'No results found. Try being more specific.'
          });
        } else {
          response.postMessage({
            as_user: true,
            text: '',
            attachments: directions
          });
        }
      }
    });
  });

  ferd.listen(/directions help/i, function(response) {
    response.postMessage({
      as_user: true,
      text: 'Usage: `directions from` *origin* `to` *destination*'
    });
  });

};

var maneuvers = {
  'turn-sharp-left' : '',
  'uturn-right' : '',
  'turn-slight-right' : ':arrow_upper_right:',
  'merge' : '',
  'roundabout-left' : '',
  'roundabout-right' : '',
  'uturn-left' : '',
  'turn-slight-left' : ':arrow_upper_left:',
  'turn-left' : ':arrow_left:',
  'ramp-right' : '',
  'turn-right' : ':arrow_right:',
  'fork-right' : '',
  'straight' : ':arrow_up:',
  'fork-left' : '',
  'ferry-train' : '',
  'turn-sharp-right' : '',
  'ramp-left' : '',
  'ferry' : ''
};

function colorText(str,array,phase) {
  if (phase == undefined) phase = 0;
  var center = 128;
  var width = 127;
  var frequency = Math.PI*2/str.length;
  for (var i = 0; i < str.length; ++i) {
    var red   = Math.sin(frequency*i+2+phase) * width + center;
    var green = Math.sin(frequency*i+0+phase) * width + center;
    var blue  = Math.sin(frequency*i+4+phase) * width + center;
    array.push(RGB2Color(red,green,blue));
  }
  return array;
}

function RGB2Color(r,g,b) {
  return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

function byte2Hex(n) {
  var nybHexString = '0123456789ABCDEF';
  return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
}
