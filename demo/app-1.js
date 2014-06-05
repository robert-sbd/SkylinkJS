//--------------------
// PURE GUI
//--------------------
window._tests = {};
//--------
$('#chatMessage').keyup(function(e){ if(e.keyCode == 13) $(this).trigger("enterKey"); });
//--------

//--------
function blink(){
  $(".channel").css("background-color","00FF00");
  setTimeout(function(){$(".channel").css("background-color","green")},500);
};
//--------
function addPeer( peer ){
  var newListEntry = '<li id="user' + peer.id + '" class="badQuality">'
    + '<div style="text-align:center;"><h4>' + peer.displayName + '</h4>';
  for( var i=0; i<6; i++) newListEntry += '<div class="circle ' + i + '"></div>';
  newListEntry += '</div></li>'
  $("#contactList ul.active").append( newListEntry );
  $("#user" + peer.id + " .0").css("background-color","green");
};
//--------
function rmPeer( peerID ){ $("#user" + peerID).remove(); };
//--------
$(":button:not('#sendFile')").hide();

//--------------------
// GUI to API
//--------------------
$("#gumBtn"         ).click( function(e){ console.log(window.webrtcDetectedBrowser);t.getDefaultStream(); } );
$("#joinRoomBtn"    ).click( function(e){ t.joinRoom();         } );
$("#leaveRoomBtn"   ).click( function(e){ t.leaveRoom();        } );
$('#chatMessage').bind("enterKey", function(e) {
  t.sendChatMsg( $('#chatMessage').val() );
  $('#chatMessage').val('');
});
$("#inputFile").change( function() {
  window.files = $(this)[0].files;
  console.log("SendFile[input] - Files selected:");
  console.dir($(this)[0].files);
});
$("#sendFile").click( function() {
  if(!window.files) {
    console.log("SendFile - No Files selected");
    return;
  } else {
    console.log("SendFile - Files to send:");
    console.info("Length: " + window.files.length);
    console.dir(window.files);
    if(window.files.length>0) {
      $("#sendFile")[0].disabled = true;
      console.log("SendFile - Button temporarily disabled to prevent crash");
    }
  }
  var FILE_SIZE_LIMIT = 1024*1024*200;
  for(var i=0;i<window.files.length;i++) {
    var file = window.files[i];
    if(file.size <= FILE_SIZE_LIMIT) {
      t.sendFile(file);
      $('#inputFile').val('');
    } else {
      console.error('SendFile - [' + file.name + '] exceeded limit of 200MB.\nFile size: ' + (file.size/(1024*1024)) + ' MB');
      alert(
        'File [' + file.name + '] exceeded the limit of 200MB.\n'
        + 'We only currently support files up to 200MB for this demo.'
      );
    }
  }
  $("#sendFile")[0].disabled = false;
});
//--------------------
// API to GUI
//--------------------

// get the variables needed to connect to skyway
var roomserver = 'http://54.251.99.180:8080/';
var apikey = 'apitest';
var room  = null;
var t = new Skyway();
t.init(roomserver, apikey, room);

//--------
t.on("channelOpen", function(){ $(".channel").css("background-color","green"); });
//--------
t.on("channelClose", function(){
  $("#joinRoomBtn" ).show();
  $("#leaveRoomBtn" ).hide();
  $(".channel").css("background-color","red");
 });
//--------
t.on("joinedRoom", function(){ 
  $("#joinRoomBtn"   ).hide(); 
  $("#leaveRoomBtn").show(); 
  // If not supportive of File, FileReader, Blob quit
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    $("#sendFileController").show();
  }
});
//--------
t.on("channelMessage", blink);
//--------
t.on("receivedDataStatus", function(params){
  console.log(params);
  $("#"+params.channel+"_status")[0].innerHTML += 
    "<em title='" + params.user + " received your file'>&#10003;</em>";
});
//--------
t.on("receivedData", function(params){
  console.log("SendFile - Received file trigged");
  console.dir(params);
  console.info("MyUserId: " + params.myuserid);
  var isSender = params.senderid===params.myuserid;
  var newEntry = '<li class="thatsMe"> <div class="user">' + params.myuserid + '</div>'
    + '<div class="time">' + (new Date()).getHours() + ':' + (new Date()).getMinutes() + ':'
    + (new Date()).getSeconds() + '</div>'
    + '<div class="message">'
    + '<div class="file">'
    + '<p class="title">' 
    + ((isSender)?"You've sent a File":"File received from " + params.myuserid) 
    + ((isSender)?'<span id="' + params.channel + '_status"></span>':'')
    + '</p>'
    + '<a href="' + params.data + '" download="' + params.filename + '">Download File</a>'
    + '<div class="wrap"><div class="icon"></div>'
    + '<div class="details">'
    + '<b>' + params.filename + '</b>'
    + '<span>' + params.filesize + ' B</span>'
    + '</div></div>'
    + '</div></div></li>'
  $('#chatLog').append( newEntry );
});
//--------
t.on("chatMessage", function ( msg, nick, isPvt ) {
  var newEntry = '<li class="thatsMe"> <div class="user">' + nick + '</div>'
    + '<div class="time">' + (new Date()).getHours() + ':' + (new Date()).getMinutes() + ':'
    + (new Date()).getSeconds() + '</div>'
    + '<div class="message">' + (isPvt?"<i>[pvt msg] ":"") + msg + (isPvt?"</i>":"")
    + '</div></li>'
  $('#chatLog').append( newEntry );
});
//--------
t.on("peerJoined", function(id){ addPeer({ id: id , displayName: id }); });
//--------
var nbPeers = 0;
t.on("addPeerStream", function(peerID, stream){
  nbPeers += 1;
  if( nbPeers > 2 ){
    alert( "We only support up to 2 streams in this demo" );
    nbPeers -= 1;
    return;
  }
  var videoElmnt = $("#videoRemote1")[0];
  if( videoElmnt.src.substring(0,4) == 'blob' ) videoElmnt = $("#videoRemote2")[0];
  videoElmnt.peerID = peerID;
  attachMediaStream( videoElmnt, stream );
});
//--------
t.on("mediaAccessSuccess", function(stream){
  attachMediaStream( $('#videoLocal1')[0], stream ); $("#gumBtn").hide();
});
//--------
t.on("readyStateChange", function(state){
  if(!state) return; $("#joinRoomBtn").show(); $("#gumBtn").show();
  $("#channelStatus").show();
  if(!window._tests.RSC) window._tests.RSC = [];
  window._tests.RSC.push(state);
});
//--------
t.on("peerLeft", function(peerID){
  nbPeers -= 1;
  $("video").each( function(){
    if( this.peerID == peerID ){
      this.poster  = '/default.png';
      this.src = '';
    }
  });
 rmPeer( peerID );
});
//--------
t.on("handshakeProgress", function(state, user){
  var stage = 0;
  switch( state ){
    case 'welcome': stage = 1; break;
    case 'offer'  : stage = 2; break;
    case 'answer' : stage = 3; break;
  }
  for( var i=0; i<=stage; i++ )
    $("#user" + user + " ." + i ).css("background-color","green");
  if(!window._tests.HSP) window._tests.HSP = [];
  window._tests.HSP.push(state+"_"+user);
});
//--------
t.on("candidateGenerationState",function(state, user){
  var color = "yellow";
  switch( state ){
    case 'done': color = 'green'; break;
  }
  $("#user" + user + " .4" ).css("background-color",color);
  if(!window._tests.CGS) window._tests.CGS = [];
  window._tests.CGS.push(state);
});
//--------
t.on("iceConnectionState",function(state, user){
  var color = 'yellow';
  switch( state ){
    case 'new': case 'closed': case 'failed': color = 'red';    break;
    case 'checking':  case 'disconnected':    color = 'yellow'; break;
    case 'connected': case 'completed':       color = 'green';
  }
  $("#user" + user + " .5" ).css("background-color",color);
  if( state == 'checking' ){
    setTimeout( function(){
      if( $('#user' + user + " .5" ).css("background-color") == 'yellow' )
        rmPeer( user );
    }, 30000 );
  }
  if(!window._tests.ICS) window._tests.ICS = [];
  window._tests.ICS.push(state);
});