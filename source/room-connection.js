/**
 * The list of Signaling server reaction states during <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.
 * @attribute SYSTEM_ACTION
 * @param {String} WARNING <small>Value <code>"warning"</code></small>
 *   The value of the state when Room session is about to end.
 * @param {String} REJECT  <small>Value <code>"reject"</code></small>
 *   The value of the state when Room session has failed to start or has ended.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * The list of Signaling server reaction states reason of action code during
 * <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.
 * @attribute SYSTEM_ACTION_REASON
 * @param {String} CREDENTIALS_EXPIRED <small>Value <code>"oldTimeStamp"</code></small>
 *   The value of the reason code when Room session token has expired.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} CREDENTIALS_ERROR   <small>Value <code>"credentialError"</code></small>
 *   The value of the reason code when Room session token provided is invalid.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 * @param {String} DUPLICATED_LOGIN    <small>Value <code>"duplicatedLogin"</code></small>
 *   The value of the reason code when Room session token has been used already.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} ROOM_NOT_STARTED    <small>Value <code>"notStart"</code></small>
 *   The value of the reason code when Room session has not started.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} EXPIRED             <small>Value <code>"expired"</code></small>
 *   The value of the reason code when Room session has ended already.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} ROOM_LOCKED         <small>Value <code>"locked"</code></small>
 *   The value of the reason code when Room is locked.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} FAST_MESSAGE        <small>Value <code>"fastmsg"</code></small>
 *    The value of the reason code when User is flooding socket messages to the Signaling server
 *    that is sent too quickly within less than a second interval.
 *    <small>Happens after Room session has started. This can be caused by various methods like
 *    <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *    <a href="#method_setUserData"><code>setUserData()</code> method</a>,
 *    <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *    <a href="#method_enableAudio"><code>enableAudio()</code> method</a>,
 *    <a href="#method_enableVideo"><code>enableVideo()</code> method</a>,
 *    <a href="#method_disableAudio"><code>disableAudio()</code> method</a> and
 *    <a href="#method_disableVideo"><code>disableVideo()</code> method</a></small>
 *    <small>Results with: <code>WARNING</code></small>
 * @param {String} ROOM_CLOSING        <small>Value <code>"toClose"</code></small>
 *    The value of the reason code when Room session is ending.
 *    <small>Happens after Room session has started. This serves as a prerequisite warning before
 *    <code>ROOM_CLOSED</code> occurs.</small>
 *    <small>Results with: <code>WARNING</code></small>
 * @param {String} ROOM_CLOSED         <small>Value <code>"roomclose"</code></small>
 *    The value of the reason code when Room session has just ended.
 *    <small>Happens after Room session has started.</small>
 *    <small>Results with: <code>REJECT</code></small>
 * @param {String} SERVER_ERROR        <small>Value <code>"serverError"</code></small>
 *    The value of the reason code when Room session fails to start due to some technical errors.
 *    <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *    <small>Results with: <code>REJECT</code></small>
 * @param {String} KEY_ERROR           <small>Value <code>"keyFailed"</code></small>
 *    The value of the reason code when Room session fails to start due to some technical error pertaining to
 *    App Key initialization.
 *    <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *    <small>Results with: <code>REJECT</code></small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.SYSTEM_ACTION_REASON = {
  CREDENTIALS_EXPIRED: 'oldTimeStamp',
  CREDENTIALS_ERROR: 'credentialError',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  ROOM_NOT_STARTED: 'notStart',
  EXPIRED: 'expired',
  ROOM_LOCKED: 'locked',
  FAST_MESSAGE: 'fastmsg',
  ROOM_CLOSING: 'toclose',
  ROOM_CLOSED: 'roomclose',
  SERVER_ERROR: 'serverError',
  KEY_ERROR: 'keyFailed'
};

/**
 * Function that starts the Room session.
 * @method joinRoom
 * @param {String} [room] The Room name.
 * - When not provided or is provided as an empty string, its value is the <code>options.defaultRoom</code>
 *   provided in the <a href="#method_init"><code>init()</code> method</a>.
 *   <small>Note that if you are using credentials based authentication, you cannot switch the Room
 *   that is not the same as the <code>options.defaultRoom</code> defined in the
 *   <a href="#method_init"><code>init()</code> method</a>.</small>
 * @param {JSON} [options] The Room session configuration options.
 * @param {JSON|String} [options.userData] The User custom data.
 *   <small>This can be set after Room session has started using the
 *   <a href="#method_setUserData"><code>setUserData()</code> method</a>.</small>
 * @param {Boolean} [options.useExactConstraints] The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options.useExactConstraints</code> parameter settings.
 *   <small>See the <code>options.useExactConstraints</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> for more information.</small>
 * @param {Boolean|JSON} [options.audio] The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options.audio</code> parameter settings.
 *   <small>When value is defined as <code>true</code> or an object, <a href="#method_getUserMedia">
 *   <code>getUserMedia()</code> method</a> to be invoked to retrieve new Stream. If
 *   <code>options.video</code> is not defined, it will be defined as <code>false</code>.</small>
 *   <small>Object signature matches the <code>options.audio</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.</small>
 * @param {Boolean|JSON} [options.video] The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options.video</code> parameter settings.
 *   <small>When value is defined as <code>true</code> or an object, <a href="#method_getUserMedia">
 *   <code>getUserMedia()</code> method</a> to be invoked to retrieve new Stream. If
 *   <code>options.audio</code> is not defined, it will be defined as <code>false</code>.</small>
 *   <small>Object signature matches the <code>options.video</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.</small>
 * @param {JSON} [options.bandwidth] <blockquote class="info">Note that this is currently not supported
 *   with Firefox browsers versions 48 and below as noted in an existing
 *   <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=976521#c21">bugzilla ticket here</a>.</blockquote>
 *   The configuration to set the maximum streaming bandwidth to send to / receive from Peers.
 *   <small>Note that Peers may override the "receive from" maximum streaming bandwidth depending on the Peers configuration.</small>
 * @param {Number} [options.bandwidth.audio] The maximum audio streaming bandwidth sent to Peers in kbps.
 *   <small>Recommended values are <code>50</code> to <code>200</code>. <code>50</code> is sufficient enough for
 *   an audio call. The higher you go if you want clearer audio and to be able to hear music streaming.</small>
 * @param {Number} [options.bandwidth.video] The maximum video streaming bandwidth sent to Peers.
 *   <small>Recommended values are <code>256</code>-<code>500</code> for 180p quality,
 *   <code>500</code>-<code>1024</code> for 360p quality, <code>1024</code>-<code>2048</code> for 720p quality
 *   and <code>2048</code>-<code>4096</code> for 1080p quality.</small>
 * @param {Number} [options.bandwidth.data] The maximum data streaming bandwidth sent to Peers.
 *   <small>This affects the P2P messaging in <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>,
 *   and data transfers in <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a> and
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a>.</small>
 * @param {JSON} [options.googleXBandwidth] <blockquote class="info">Note that this is an experimental configuration
 *   and may cause disruptions in connections or connectivity issues when toggled, or may not work depending on
 *   browser supports. Currently, this only toggles the video codec bandwidth configuration.</blockquote>
 *   The configuration to set the experimental google video streaming bandwidth sent to Peers.
 *   <small>Note that Peers may override the "receive from" streaming bandwidth depending on the Peers configuration.</small>
 * @param {Number} [options.googleXBandwidth.min] The minimum experimental google video streaming bandwidth sent to Peers.
 *   <small>This toggles the <code>"x-google-min-bitrate"</code> flag in the session description.</small>
 * @param {Number} [options.googleXBandwidth.max] The maximum experimental google video streaming bandwidth sent to Peers.
 *   <small>This toggles the <code>"x-google-max-bitrate"</code> flag in the session description.</small>
 * @param {Boolean} [options.manualGetUserMedia] The flag if <code>joinRoom()</code> should trigger
 *   <a href="#event_mediaAccessRequired"><code>mediaAccessRequired</code> event</a> in which the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> or
 *   <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   must be retrieved as a requirement before Room session may begin.
 *   <small>This ignores the <code>options.audio</code> and <code>options.video</code> configuration.</small>
 *   <small>After 30 seconds without any Stream retrieved, this results in the `callback(error, ..)` result.</small>
 * @param {JSON} [options.sdpSettings] <blockquote class="info">Note that this is an EXTREMELY experimental configuration
 *   and may cause disruptions in connections or connectivity issues when toggled. It is never recommended to toggle
 *   these configuration unless required.</blockquote>
 *   The configuration to set the session description settings.
 * @param {JSON} [options.sdpSettings.connection] The configuration to set the session description connection settings.
 *   <small>Note that this configuration may disable the media streaming and these settings will be enabled for
 *   MCU server Peer connection regardless of the flags configured.</small>
 * @param {Boolean} [options.sdpSettings.connection.audio=true] The configuration to enable audio session description connection.
 * @param {Boolean} [options.sdpSettings.connection.video=true] The configuration to enable video session description connection.
 * @param {Boolean} [options.sdpSettings.connection.data=true] The configuration to enable Datachannel session description connection.
 * @param {JSON} [options.sdpSettings.direction] The configuration to set the session description connection direction
 *   to enable or disable uploading and downloading audio or video media streaming.
 *   <small>Note that this configuration does not prevent RTCP packets from being sent and received.</small>
 * @param {JSON} [options.sdpSettings.direction.audio] The configuration to set the session description
 *   connection direction for audio streaming.
 * @param {Boolean} [options.sdpSettings.direction.audio.send=true] The flag if uploading audio streaming
 *   should be enabled when available.
 * @param {Boolean} [options.sdpSettings.direction.audio.receive=true] The flag if downloading audio
 *   streaming should be enabled when available.
 * @param {JSON} [options.sdpSettings.direction.video] The configuration to set the session description
 *   connection direction for video streaming.
 * @param {Boolean} [options.sdpSettings.direction.video.send=true] The flag if uploading video streaming
 *   should be enabled when available.
 * @param {Boolean} [options.sdpSettings.direction.video.receive=true] The flag if downloading video streaming
 *   should be enabled when available.
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_peerJoined">
 *   <code>peerJoined</code> event</a> triggering <code>isSelf</code> parameter payload value as <code>true</code>
 *   for request success.</small>
 * @param {JSON} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {Error|String} callback.error.error The error received when starting Room session has failed.
 * @param {Number} [callback.error.errorCode] The current <a href="#method_init"><code>init()</code> method</a> ready state.
 *   <small>Defined as <code>null</code> when no <a href="#method_init"><code>init()</code> method</a>
 *   has not been called due to invalid configuration.</small>
 *   [Rel: Skylink.READY_STATE_CHANGE]
 * @param {String} callback.error.room The Room name.
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.room The Room name.
 * @param {String} callback.success.peerId The User's Room session Peer ID.
 * @param {JSON} callback.success.peerInfo The User's current Room session information.
 *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
 *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
 * @example
 *   // Example 1: Connecting to the default Room without Stream
 *   skylinkDemo.joinRoom(function (error, success) {
 *     if (error) return;
 *     console.log("User connected.");
 *   });
 *
 *   // Example 2: Connecting to Room "testxx" with Stream
 *   skylinkDemo.joinRoom("testxx", {
 *     audio: true,
 *     video: true
 *   }, function (error, success) {
 *     if (error) return;
 *     console.log("User connected with getUserMedia() Stream.")
 *   });
 *
 *   // Example 3: Connecting to default Room with Stream retrieved earlier
 *   skylinkDemo.getUserMedia(function (gUMError, gUMSuccess) {
 *     if (gUMError) return;
 *     skylinkDemo.joinRoom(function (error, success) {
 *       if (error) return;
 *       console.log("User connected with getUserMedia() Stream.");
 *     });
 *   });
 *
 *   // Example 4: Connecting to "testxx" Room with shareScreen() Stream retrieved manually
 *   skylinkDemo.on("mediaAccessRequired", function () {
 *     skylinkDemo.shareScreen(function (sSError, sSSuccess) {
 *       if (sSError) return;
 *     });
 *   });
 *
 *   skylinkDemo.joinRoom("testxx", {
 *     manualGetUserMedia: true
 *   }, function (error, success) {
 *     if (error) return;
 *     console.log("User connected with shareScreen() Stream.");
 *   });
 *
 *   // Example 5: Connecting to "testxx" Room with User custom data
 *   var data = { username: "myusername" };
 *   skylinkDemo.joinRoom("testxx", {
 *     userData: data
 *   }, function (error, success) {
 *     if (error) return;
 *     console.log("User connected with correct user data?", success.peerInfo.userData.username === data.username);
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If User is in a Room: <ol>
 *   <li>Invoke <a href="#method_leaveRoom"><code>leaveRoom()</code> method</a>
 *   to end current Room connection. <small>Invoked <a href="#method_leaveRoom"><code>leaveRoom()</code>
 *   method</a> <code>stopMediaOptions</code> parameter value will be <code>false</code>.</small>
 *   <small>Regardless of request errors, <code>joinRoom()</code> will still proceed.</small></li></ol></li>
 *   <li>Check if Room name provided matches the Room name of the currently retrieved Room session token. <ol>
 *   <li>If Room name does not matches: <ol>
 *   <li>Invoke <a href="#method_init"><code>init()</code> method</a> to retrieve new Room session token. <ol>
 *   <li>If request has errors: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   <li>Open a new socket connection to Signaling server. <ol><li>If Socket connection fails: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers parameter payload
 *   <code>errorCode</code> as <code>CONNECTION_FAILED</code>. <ol>
 *   <li>Checks if there are fallback ports and transports to use. <ol>
 *   <li>If there are still fallback ports and transports: <ol>
 *   <li>Attempts to retry socket connection to Signaling server. <ol>
 *   <li><a href="#event_channelRetry"><code>channelRetry</code> event</a> triggers.</li>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers parameter
 *   payload <code>errorCode</code> as <code>RECONNECTION_ATTEMPT</code>.</li>
 *   <li>If attempt to retry socket connection to Signaling server has failed: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers parameter payload
 *   <code>errorCode</code> as <code>RECONNECTION_FAILED</code>.</li>
 *   <li>Checks if there are still any more fallback ports and transports to use. <ol>
 *   <li>If there are is no more fallback ports and transports to use: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers
 *   parameter payload <code>errorCode</code> as <code>RECONNECTION_ABORTED</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li><li>Else: <ol><li><b>REPEAT</b> attempt to retry socket connection
 *   to Signaling server step.</li></ol></li></ol></li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers
 *   parameter payload <code>errorCode</code> as <code>CONNECTION_ABORTED</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   <li>If socket connection to Signaling server has opened: <ol>
 *   <li><a href="#event_channelOpen"><code>channelOpen</code> event</a> triggers.</li></ol></li></ol></li>
 *   <li>Checks if there is <code>options.manualGetUserMedia</code> requested <ol><li>If it is requested: <ol>
 *   <li><a href="#event_mediaAccessRequired"><code>mediaAccessRequired</code> event</a> triggers.</li>
 *   <li>If more than 30 seconds has passed and no <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>
 *   or <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   has been retrieved: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li><li>Else: <ol>
 *   <li>If there is <code>options.audio</code> or <code>options.video</code> requested: <ol>
 *   <li>Invoke <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>. <ol>
 *   <li>If request has errors: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   </ol></li><li>Starts the Room session <ol><li>If Room session has started successfully: <ol>
 *   <li><a href="#event_peerJoined"><code>peerJoined</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li>
 *   <li>If MCU is enabled for the App Key provided in <a href="#method_init"><code>init()</code>
 *   method</a> and connected: <ol><li><a href="#event_serverPeerJoined"><code>serverPeerJoined</code>
 *   event</a> triggers <code>serverPeerType</code> as <code>MCU</code>. <small>MCU has
 *   to be present in the Room in order for Peer connections to commence.</small></li>
 *   <li>Checks for any available Stream <ol>
 *   <li>If <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> is available: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a>
 *   triggers parameter payload <code>isSelf</code> value as <code>true</code> and <code>stream</code>
 *   as <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.
 *   <small>User will be sending <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   to Peers.</small></li></ol></li>
 *   <li>Else if <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> is available: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a> triggers parameter
 *   payload <code>isSelf</code> value as <code>true</code> and <code>stream</code> as
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 *   <small>User will be sending <code>getUserMedia()</code> Stream to Peers.</small></li></ol></li><li>Else: <ol>
 *   <li>No Stream will be sent.</li></ol></li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_systemAction"><code>systemAction</code> event</a> triggers
 *   parameter payload <code>action</code> as <code>REJECT</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.5
 */

Skylink.prototype.joinRoom = function(room, options, callback) {
  var self = this;
  var selectedRoom = self._defaultRoom;
  var previousRoom = self._selectedRoom;
  var mediaOptions = {};

  if (room && typeof room === 'string') {
    selectedRoom = room;
  } else if (room && typeof room === 'object') {
    mediaOptions = room;
  } else if (typeof room === 'function') {
    callback = room;
  }

  if (options && typeof options === 'object') {
    mediaOptions = options;
  } else if (typeof options === 'function') {
    callback = options;
  }

  var resolveAsErrorFn = function (error, tryRoom, readyState) {
    log.error(error);

    if (typeof callback === 'function') {
      callback({
        room: tryRoom,
        errorCode: readyState || null,
        error: typeof error === 'string' ? new Error(error) : error
      });
    }
  };

  var joinRoomFn = function () {
    self._initSelectedRoom(selectedRoom, function(initError, initSuccess) {
      if (initError) {
        resolveAsErrorFn(initError.error, self._selectedRoom, self._readyState);
        return;
      }

      self._waitForOpenChannel(mediaOptions, function (error, success) {
        if (error) {
          resolveAsErrorFn(error, self._selectedRoom, self._readyState);
          return;
        }

        self.once('peerJoined', function(peerId, peerInfo, isSelf) {
          if (typeof callback === 'function') {
            log.info([null, 'Room', selectedRoom, 'Connected to Room ->'], peerInfo);

            callback(null, {
              room: self._selectedRoom,
              peerId: peerId,
              peerInfo: peerInfo
            });
          }
        }, function(peerId, peerInfo, isSelf) {
          return peerInfo.room === selectedRoom && isSelf;
        });

        self._sendChannelMessage({
          type: self._SIG_MESSAGE_TYPE.JOIN_ROOM,
          uid: self._user.uid,
          cid: self._key,
          rid: self._room.id,
          userCred: self._user.token,
          timeStamp: self._user.timeStamp,
          apiOwner: self._appKeyOwner,
          roomCred: self._room.token,
          start: self._room.startDateTime,
          len: self._room.duration,
          isPrivileged: self._isPrivileged === true, // Default to false if undefined
          autoIntroduce: self._autoIntroduce !== false, // Default to true if undefined
          key: self._appKey
        });
      });
    });
  };

  if (room === null || ['number', 'boolean'].indexOf(typeof room) > -1) {
    resolveAsErrorFn('Invalid room name is provided', room);
    return;
  }

  if (options === null || ['number', 'boolean'].indexOf(typeof options) > -1) {
    resolveAsErrorFn('Invalid mediaOptions is provided', selectedRoom);
    return;
  }

  if (self._inRoom) {
    var stopStream = mediaOptions.audio === false && mediaOptions.video === false;

    self.leaveRoom(stopStream, function (lRError, lRSuccess) {
      log.debug([null, 'Room', previousRoom, 'Leave Room callback result ->'], [lRError, lRSuccess]);
      joinRoomFn();
    });
  } else {
    joinRoomFn();
  }
};

/**
 * <blockquote class="info">
 *   Note that this method will close any existing socket channel connection despite not being in the Room.
 * </blockquote>
 * Function that stops Room session.
 * @method leaveRoom
 * @param {Boolean|JSON} [stopMediaOptions=true] The flag if <code>leaveRoom()</code>
 *   should stop both <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   and <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 * - When provided as a boolean, this sets both <code>stopMediaOptions.userMedia</code>
 *   and <code>stopMediaOptions.screenshare</code> to its boolean value.
 * @param {Boolean} [stopMediaOptions.userMedia=true] The flag if <code>leaveRoom()</code>
 *   should stop <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 *   <small>This invokes <a href="#method_stopStream"><code>stopStream()</code> method</a>.</small>
 * @param {Boolean} [stopMediaOptions.screenshare=true] The flag if <code>leaveRoom()</code>
 *   should stop <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.
 *   <small>This invokes <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_peerLeft">
 *   <code>peerLeft</code> event</a> triggering <code>isSelf</code> parameter payload value as <code>true</code>
 *   for request success.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>leaveRoom()</code> error when stopping Room session.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.peerId The User's Room session Peer ID.
 * @param {String} callback.success.previousRoom The Room name.
 * @trigger <ol class="desc-seq">
 *   <li>If Socket connection is opened: <ol><li><a href="#event_channelClose"><code>channelClose</code> event</a> triggers.</li></ol></li>
 *   <li>Checks if User is in Room. <ol><li>If User is not in a Room: <ol><li><b>ABORT</b> and return error.</li>
 *   </ol></li><li>Else: <ol><li>If parameter <code>stopMediaOptions.userMedia</code> value is <code>true</code>: <ol>
 *   <li>Invoke <a href="#method_stopStream"><code>stopStream()</code> method</a>. 
 *   <small>Regardless of request errors, <code>leaveRoom()</code> will still proceed.</small></li></ol></li>
 *   <li>If parameter <code>stopMediaOptions.screenshare</code> value is <code>true</code>: <ol>
 *   <li>Invoke <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.
 *   <small>Regardless of request errors, <code>leaveRoom()</code> will still proceed.</small></li></ol></li>
 *   <li><a href="#event_peerLeft"><code>peerLeft</code> event</a> triggers for User and all connected Peers in Room.</li>
 *   <li>If MCU is enabled for the App Key provided in <a href="#method_init"><code>init()</code> method</a>
 *   and connected: <ol><li><a href="#event_serverPeerLeft"><code>serverPeerLeft</code> event</a>
 *   triggers parameter payload <code>serverPeerType</code> as <code>MCU</code>.</li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.leaveRoom = function(stopMediaOptions, callback) {
  var self = this;
  var stopUserMedia = true;
  var stopScreenshare = true;
  var previousRoom = self._selectedRoom;
  var previousUserPeerId = self._user ? self._user.sid : null;
  var peersThatLeft = [];
  var isNotInRoom = !self._inRoom;

  if (typeof stopMediaOptions === 'boolean') {
    if (stopMediaOptions === false) {
      stopUserMedia = false;
      stopScreenshare = false;
    }
  } else if (stopMediaOptions && typeof stopMediaOptions === 'object') {
    stopUserMedia = stopMediaOptions.userMedia !== false;
    stopScreenshare = stopMediaOptions.screenshare !== false;
  } else if (typeof stopMediaOptions === 'function') {
    callback = stopMediaOptions;
  }

  for (var infoPeerId in self._peerInformations) {
    if (self._peerInformations.hasOwnProperty(infoPeerId) && self._peerInformations[infoPeerId]) {
      peersThatLeft.push(infoPeerId);
      self._removePeer(infoPeerId);
    }
  }

  for (var connPeerId in self._peerConnections) {
    if (self._peerConnections.hasOwnProperty(connPeerId) && self._peerConnections[connPeerId]) {
      if (peersThatLeft.indexOf(connPeerId) === -1) {
        peersThatLeft.push(connPeerId);
        self._removePeer(connPeerId);
      }
    }
  }

  self._inRoom = false;
  self._closeChannel();

  if (isNotInRoom) {
    var notInRoomError = 'Unable to leave room as user is not in any room';
    log.error([null, 'Room', previousRoom, notInRoomError]);

    if (typeof callback === 'function') {
      callback(new Error(notInRoomError), null);
    }
    return;
  }

  self._stopStreams({
    userMedia: stopUserMedia,
    screenshare: stopScreenshare
  });

  self._wait(function () {
    log.log([null, 'Room', previousRoom, 'User left the room']);

    self._trigger('peerLeft', previousUserPeerId, self.getPeerInfo(), true);

    if (typeof callback === 'function') {
      callback(null, {
        peerId: previousUserPeerId,
        previousRoom: previousRoom
      });
    }
  }, function () {
    return !self._channelOpen;
  });
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that locks the current Room when in session to prevent other Peers from joining the Room.
 * @method lockRoom
 * @trigger <ol class="desc-seq">
 *   <li>Requests to Signaling server to lock Room <ol>
 *   <li><a href="#event_roomLock"><code>roomLock</code> event</a> triggers parameter payload
 *   <code>isLocked</code> value as <code>true</code>.</li></ol></li></ol>
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.lockRoom = function() {
  log.log('Update to isRoomLocked status ->', true);
  this._sendChannelMessage({
    type: this._SIG_MESSAGE_TYPE.ROOM_LOCK,
    mid: this._user.sid,
    rid: this._room.id,
    lock: true
  });
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that unlocks the current Room when in session to allow other Peers to join the Room.
 * @method unlockRoom
 * @trigger <ol class="desc-seq">
 *   <li>Requests to Signaling server to unlock Room <ol>
 *   <li><a href="#event_roomLock"><code>roomLock</code> event</a> triggers parameter payload
 *   <code>isLocked</code> value as <code>false</code>.</li></ol></li></ol>
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.unlockRoom = function() {
  log.log('Update to isRoomLocked status ->', false);
  this._sendChannelMessage({
    type: this._SIG_MESSAGE_TYPE.ROOM_LOCK,
    mid: this._user.sid,
    rid: this._room.id,
    lock: false
  });
};

/**
 * Function that waits for Socket connection to Signaling to be opened.
 * @method _waitForOpenChannel
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._waitForOpenChannel = function(mediaOptions, callback) {
  var self = this;
  // when reopening room, it should stay as 0
  self._socketCurrentReconnectionAttempt = 0;

  // wait for ready state before opening
  self._wait(function() {
    self._condition('channelOpen', function() {
      mediaOptions = mediaOptions || {};

      self._userData = mediaOptions.userData || self._userData || '';
      self._streamsBandwidthSettings = {
        googleX: {},
        bAS: {}
      };

      self._sdpSettings = {
        connection: {
          audio: true,
          video: true,
          data: true
        },
        direction: {
          audio: { send: true, receive: true },
          video: { send: true, receive: true }
        }
      };

      if (mediaOptions.bandwidth) {
        if (typeof mediaOptions.bandwidth.audio === 'number') {
          self._streamsBandwidthSettings.bAS.audio = mediaOptions.bandwidth.audio;
        }

        if (typeof mediaOptions.bandwidth.video === 'number') {
          self._streamsBandwidthSettings.bAS.video = mediaOptions.bandwidth.video;
        }

        if (typeof mediaOptions.bandwidth.data === 'number') {
          self._streamsBandwidthSettings.bAS.data = mediaOptions.bandwidth.data;
        }
      }

      if (mediaOptions.googleXBandwidth) {
        if (typeof mediaOptions.googleXBandwidth.min === 'number') {
          self._streamsBandwidthSettings.googleX.min = mediaOptions.googleXBandwidth.min;
        }

        if (typeof mediaOptions.googleXBandwidth.max === 'number') {
          self._streamsBandwidthSettings.googleX.max = mediaOptions.googleXBandwidth.max;
        }
      }

      if (mediaOptions.sdpSettings) {
        if (mediaOptions.sdpSettings.direction) {
          if (mediaOptions.sdpSettings.direction.audio) {
            self._sdpSettings.direction.audio.receive = typeof mediaOptions.sdpSettings.direction.audio.receive === 'boolean' ?
              mediaOptions.sdpSettings.direction.audio.receive : true;
            self._sdpSettings.direction.audio.send = typeof mediaOptions.sdpSettings.direction.audio.send === 'boolean' ?
              mediaOptions.sdpSettings.direction.audio.send : true;
          }

          if (mediaOptions.sdpSettings.direction.video) {
            self._sdpSettings.direction.video.receive = typeof mediaOptions.sdpSettings.direction.video.receive === 'boolean' ?
              mediaOptions.sdpSettings.direction.video.receive : true;
            self._sdpSettings.direction.video.send = typeof mediaOptions.sdpSettings.direction.video.send === 'boolean' ?
              mediaOptions.sdpSettings.direction.video.send : true;
          }
        }
        if (mediaOptions.sdpSettings.connection) {
          self._sdpSettings.connection.audio = typeof mediaOptions.sdpSettings.connection.audio === 'boolean' ?
            mediaOptions.sdpSettings.connection.audio : true;
          self._sdpSettings.connection.video = typeof mediaOptions.sdpSettings.connection.video === 'boolean' ?
            mediaOptions.sdpSettings.connection.video : true;
          self._sdpSettings.connection.data = typeof mediaOptions.sdpSettings.connection.data === 'boolean' ?
            mediaOptions.sdpSettings.connection.data : true;
        }
      }

      // get the stream
      if (mediaOptions.manualGetUserMedia === true) {
        self._trigger('mediaAccessRequired');

        var current50Block = 0;
        var mediaAccessRequiredFailure = false;
        // wait for available audio or video stream
        self._wait(function () {
          if (mediaAccessRequiredFailure === true) {
            self._onUserMediaError(new Error('Waiting for stream timeout'), false, false);
          } else {
            callback(null, self._streams.userMedia.stream);
          }
        }, function () {
          current50Block += 1;
          if (current50Block === 600) {
            mediaAccessRequiredFailure = true;
            return true;
          }

          if (self._streams.userMedia && self._streams.userMedia.stream) {
            return true;
          }
        }, 50);
        return;
      }

      if (mediaOptions.audio || mediaOptions.video) {
        self.getUserMedia({
          useExactConstraints: !!mediaOptions.useExactConstraints,
          audio: mediaOptions.audio,
          video: mediaOptions.video

        }, function (error, success) {
          if (error) {
            callback(error, null);
          } else {
            callback(null, success);
          }
        });
        return;
      }

      callback(null, null);

    }, function() { // open channel first if it's not opened

      if (!self._channelOpen) {
        self._openChannel();
      }
      return self._channelOpen;
    }, function(state) {
      return true;
    });
  }, function() {
    return self._readyState === self.READY_STATE_CHANGE.COMPLETED;
  });

};
