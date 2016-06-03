var UI = require('ui');
var Accel = require('ui/accel');
var Settings = require('settings');

// Catch configuration events
Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('http://copter.pebble.sillevis.net/?' + encodeURIComponent(JSON.stringify(Settings.option())));
});

Pebble.addEventListener('webviewclosed',function(e) {
  var configuration = JSON.parse(decodeURIComponent(e.response));
  Settings.option('socket', configuration.socket);
});

if(Settings.option('socket')) {
  var socket = new WebSocket('ws://' + Settings.option('socket') + ':8080');

  var main = new UI.Card({
    title: 'PebbleCopter',
    icon: 'images/menu_icon.png',
    subtitle: 'Bad Idea',
    body: 'Stationary',
    subtitleColor: 'indigo', // Named colors
    bodyColor: '#9a0036' // Hex colors
  });

  main.show();

  main.on('click', 'up', function(e) {
    // Send up
    main.body('UP');
    socket.send('up');
  });

  var paused = false;
  main.on('click', 'select', function(e) {
    // Send select
    if(!paused) {
      main.body('PAUSED');
      socket.close();
      paused = true;
    }
    else {
      socket = new WebSocket('ws://' + Settings.option('socket') + ':8080');
      paused = false;
    }
  });

  main.on('click', 'down', function(e) {
    // Send down
    main.body('DOWN');
    socket.send('down');
  });

  var x, y, z;
  Accel.peek(function(e) {
    x = e.accel.x;
    y = e.accel.y;
    z = e.accel.z;
  });

  Accel.on('data', function(e) {
    if(!paused) {
      var txt = '';
      if(e.accel.x > x+150) {
        txt += ' RIGHT';
        socket.send('right');
      }
      if(e.accel.x < x-150) {
        txt += ' LEFT';
        socket.send('left');
      }
      if(e.accel.y > y+150) {
        txt += ' TOP';
        socket.send('top');
      }
      if(e.accel.y < y-150) {
        txt += ' BOTTOM';
        socket.send('bottom');
      }
      main.body(txt);
    }
  });
}
else {
  var ConfigureCard = new UI.Card({
    title: 'Error',
    body: 'Please configure first!',
    style: 'small',
    scrollable: true,
    backgroundColor: 'white',
    titleColor: 'black',
    bodyColor: 'black'
  });
  ConfigureCard.show();
}