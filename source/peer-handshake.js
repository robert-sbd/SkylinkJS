/**
 * Function that creates the Peer connection offer session description.
 * @method _doOffer
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._doOffer = function(targetMid, iceRestart, mergeMessageWithOffer) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    log.warn([targetMid, 'RTCSessionDescription', 'offer', 'Dropping of creating of offer ' +
      'as connection does not exists']);
    return;
  }

  // Added checks to ensure that state is "stable" if setting local "offer"
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    log.warn([targetMid, 'RTCSessionDescription', 'offer',
      'Dropping of creating of offer as signalingState is not "' +
      self.PEER_CONNECTION_STATE.STABLE + '" ->'], pc.signalingState);
    return;
  }

  var offerConstraints = {
    offerToReceiveAudio: !(!self._sdpSettings.connection.audio && targetMid !== 'MCU') && self._getSDPCommonSupports(targetMid).video,
    offerToReceiveVideo: !(!self._sdpSettings.connection.video && targetMid !== 'MCU') && self._getSDPCommonSupports(targetMid).audio,
    iceRestart: !!((self._peerInformations[targetMid] || {}).config || {}).enableIceRestart &&
      iceRestart && self._enableIceRestart,
    voiceActivityDetection: self._voiceActivityDetection
  };

  if (self._hasMCU && typeof pc.addTransceiver !== 'function') {
    offerConstraints.offerToReceiveVideo = true;
  }

  // Add stream only at offer/answer end
  if (!self._hasMCU || targetMid === 'MCU') {
    self._addLocalMediaStreams(targetMid);
  }

  if (self._initOptions.enableDataChannel && self._peerInformations[targetMid] &&
    self._peerInformations[targetMid].config.enableDataChannel/* &&
    !(!self._sdpSettings.connection.data && targetMid !== 'MCU')*/) {
    // Edge doesn't support datachannels yet
    if (!(self._dataChannels[targetMid] && self._dataChannels[targetMid].main)) {
      self._createDataChannel(targetMid);
      self._peerConnections[targetMid].hasMainChannel = true;
    }
  }

  log.debug([targetMid, null, null, 'Creating offer with config:'], offerConstraints);

  pc.endOfCandidates = false;

  if (self._peerConnStatus[targetMid]) {
    self._peerConnStatus[targetMid].sdpConstraints = offerConstraints;
  }

  var onSuccessCbFn = function(offer) {
    log.debug([targetMid, null, null, 'Created offer'], offer);
    self._handleNegotiationStats('create_offer', targetMid, offer, false);
    self._setLocalAndSendMessage(targetMid, offer, mergeMessageWithOffer);
  };

  var onErrorCbFn = function(error) {
    log.error([targetMid, null, null, 'Failed creating an offer:'], error);
    self._handleNegotiationStats('error_create_offer', targetMid, null, false, error);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  };

  pc.createOffer(onSuccessCbFn, onErrorCbFn, AdapterJS.webrtcDetectedType === 'plugin' ? {
    mandatory: {
      OfferToReceiveAudio: offerConstraints.offerToReceiveAudio,
      OfferToReceiveVideo: offerConstraints.offerToReceiveVideo,
      iceRestart: offerConstraints.iceRestart,
      voiceActivityDetection: offerConstraints.voiceActivityDetection
    }
  } : offerConstraints);
};

/**
 * Function that creates the Peer connection answer session description.
 * This comes after receiving and setting the offer session description.
 * @method _doAnswer
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._doAnswer = function(targetMid) {
  var self = this;
  log.log([targetMid, null, null, 'Creating answer with config:'],
    self._room.connection.sdpConstraints);
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    log.warn([targetMid, 'RTCSessionDescription', 'answer', 'Dropping of creating of answer ' +
      'as connection does not exists']);
    return;
  }

  // Added checks to ensure that state is "have-remote-offer" if setting local "answer"
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
    log.warn([targetMid, 'RTCSessionDescription', 'answer',
      'Dropping of creating of answer as signalingState is not "' +
      self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER + '" ->'], pc.signalingState);
    return;
  }

  var answerConstraints = AdapterJS.webrtcDetectedBrowser === 'edge' ? {
    offerToReceiveVideo: !(!self._sdpSettings.connection.audio && targetMid !== 'MCU') &&
      self._getSDPCommonSupports(targetMid, pc.remoteDescription).video,
    offerToReceiveAudio: !(!self._sdpSettings.connection.video && targetMid !== 'MCU') &&
      self._getSDPCommonSupports(targetMid, pc.remoteDescription).audio,
    voiceActivityDetection: self._voiceActivityDetection
  } : undefined;

  // Add stream only at offer/answer end
  if (!self._hasMCU || targetMid === 'MCU') {
    self._addLocalMediaStreams(targetMid);
  }

  if (self._peerConnStatus[targetMid]) {
    self._peerConnStatus[targetMid].sdpConstraints = answerConstraints;
  }

  var onSuccessCbFn = function(answer) {
    log.debug([targetMid, null, null, 'Created answer'], answer);
    self._handleNegotiationStats('create_answer', targetMid, answer, false);

    if (AdapterJS.webrtcDetectedBrowser === 'firefox') {
      self._setOriginalDTLSRole(answer, false);
      answer.sdp = self._modifyDTLSRole(answer);
    }

    self._setLocalAndSendMessage(targetMid, answer);
  };

  var onErrorCbFn = function(error) {
    log.error([targetMid, null, null, 'Failed creating an answer:'], error);
    self._handleNegotiationStats('error_create_answer', targetMid, null, false, error);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  };

  // No ICE restart constraints for createAnswer as it fails in chrome 48
  // { iceRestart: true }
  pc.createAnswer(onSuccessCbFn, onErrorCbFn, answerConstraints);
};

/**
 * Function that sets the local session description and sends to Peer.
 * If trickle ICE is disabled, the local session description will be sent after
 *   ICE gathering has been completed.
 * @method _setLocalAndSendMessage
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._setLocalAndSendMessage = function(targetMid, _sessionDescription, mergeMessage) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that sessionDescription is defined first
  if (!(!!_sessionDescription && !!_sessionDescription.sdp)) {
    log.warn([targetMid, 'RTCSessionDescription', null, 'Local session description is undefined ->'], _sessionDescription);
    return;
  }

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    log.warn([targetMid, 'RTCSessionDescription', _sessionDescription.type,
      'Local session description will not be set as connection does not exists ->'], _sessionDescription);
    self._handleNegotiationStats('dropped_' + sessionDescription.type, targetMid, sessionDescription, false, 'Peer connection does not exists');
    return;

  } else if (_sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER &&
    pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    log.warn([targetMid, 'RTCSessionDescription', _sessionDescription.type, 'Local session description ' +
      'will not be set as signaling state is "' + pc.signalingState + '" ->'], _sessionDescription);
    self._handleNegotiationStats('dropped_offer', targetMid, sessionDescription, false, 'Peer connection state is "' + pc.signalingState + '"');
    return;

  // Added checks to ensure that state is "have-remote-offer" if setting local "answer"
  } else if (_sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER &&
    pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
    log.warn([targetMid, 'RTCSessionDescription', _sessionDescription.type, 'Local session description ' +
      'will not be set as signaling state is "' + pc.signalingState + '" ->'], _sessionDescription);
    self._handleNegotiationStats('dropped_answer', targetMid, sessionDescription, false, 'Peer connection state is "' + pc.signalingState + '"');
    return;

  // Added checks if there is a current local sessionDescription being processing before processing this one
  } else if (pc.processingLocalSDP) {
    log.warn([targetMid, 'RTCSessionDescription', _sessionDescription.type,
      'Local session description will not be set as another is being processed ->'], _sessionDescription);
    self._handleNegotiationStats('dropped_' + sessionDescription.type, targetMid, sessionDescription, false, 'Peer connection is currently processing an existing sdp');
    return;
  }

  pc.processingLocalSDP = true;

  // Sets and expected receiving codecs etc.
  var sessionDescription = {
    type: _sessionDescription.type,
    sdp: _sessionDescription.sdp
  };

  sessionDescription.sdp = self._removeSDPFirefoxH264Pref(targetMid, sessionDescription);
  sessionDescription.sdp = self._setSDPCodecParams(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPUnknownAptRtx(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPCodecs(targetMid, sessionDescription);
  sessionDescription.sdp = self._handleSDPConnectionSettings(targetMid, sessionDescription, 'local');
  sessionDescription.sdp = self._removeSDPREMBPackets(targetMid, sessionDescription);
  sessionDescription.sdp = self._setSCTPport(targetMid, sessionDescription);

  if (self._peerConnectionConfig.disableBundle) {
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=group:BUNDLE.*\r\n/gi, '');
  }

  log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
    'Local session description updated ->'], sessionDescription.sdp);

  var onSuccessCbFn = function() {
    log.debug([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description has been set ->'], sessionDescription);

    // FIX for Chrome 75
    if (AdapterJS.webrtcDetectedBrowser === 'chrome' && AdapterJS.webrtcDetectedVersion === 75 && pc.getSenders()[0].transport) {
      var statsInterval = null;
      pc.getSenders()[0].transport.onstatechange = function(evt) {
          var iceConnectionState = evt.target.state;

          if (iceConnectionState === 'connecting') {
              iceConnectionState = self.ICE_CONNECTION_STATE.CHECKING;
          }

          log.debug([targetMid, 'RTCIceConnectionState', null, 'Ice connection state changed ->'], iceConnectionState);

          self._handleIceConnectionStats(pc.iceConnectionState, targetMid);
          self._trigger('iceConnectionState', iceConnectionState, targetMid);

          if (iceConnectionState === self.ICE_CONNECTION_STATE.FAILED && self._initOptions.enableIceTrickle) {
              self._trigger('iceConnectionState', self.ICE_CONNECTION_STATE.TRICKLE_FAILED, targetMid);
          }

          if (self._peerConnStatus[targetMid]) {
              self._peerConnStatus[targetMid].connected = [self.ICE_CONNECTION_STATE.COMPLETED,
                  self.ICE_CONNECTION_STATE.CONNECTED].indexOf(iceConnectionState) > -1;
          }

          if (!statsInterval && [self.ICE_CONNECTION_STATE.CONNECTED, self.ICE_CONNECTION_STATE.COMPLETED].indexOf(iceConnectionState) > -1) {
              statsInterval = true;

              // Do an initial getConnectionStatus() to backfill the first retrieval in order to do (currentTotalStats - lastTotalStats).
              self.getConnectionStatus(targetMid, function () {
                  statsInterval = setInterval(function () {
                      if (!(self._peerConnections[targetMid] && self._peerConnections[targetMid].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
                          clearInterval(statsInterval);
                          return;
                      }
                      self._handleBandwidthStats(targetMid);
                  }, 20000);
              });
          }

          if (!self._hasMCU && [self.ICE_CONNECTION_STATE.CONNECTED, self.ICE_CONNECTION_STATE.COMPLETED].indexOf(
              iceConnectionState) > -1 && !!self._bandwidthAdjuster && !bandwidth && AdapterJS.webrtcDetectedBrowser !== 'edge' &&
              (((self._peerInformations[targetMid] || {}).agent || {}).name || 'edge') !== 'edge') {
              var currentBlock = 0;
              var formatTotalFn = function (arr) {
                  var total = 0;
                  for (var i = 0; i < arr.length; i++) {
                      total += arr[i];
                  }
                  return total / arr.length;
              };
              bandwidth = {
                  audio: { send: [], recv: [] },
                  video: { send: [], recv: [] }
              };
              var pullInterval = setInterval(function () {
                  if (!(self._peerConnections[targetMid] && self._peerConnections[targetMid].signalingState !==
                      self.PEER_CONNECTION_STATE.CLOSED) || !self._bandwidthAdjuster || !self._peerBandwidth[targetMid]) {
                      clearInterval(pullInterval);
                      return;
                  }
                  self._retrieveStats(targetMid, function (err, stats) {
                      if (!(self._peerConnections[targetMid] && self._peerConnections[targetMid].signalingState !==
                          self.PEER_CONNECTION_STATE.CLOSED) || !self._bandwidthAdjuster) {
                          clearInterval(pullInterval);
                          return;
                      }
                      if (err) {
                          bandwidth.audio.send.push(0);
                          bandwidth.audio.recv.push(0);
                          bandwidth.video.send.push(0);
                          bandwidth.video.recv.push(0);
                      } else {
                          bandwidth.audio.send.push(stats.audio.sending.bytes * 8);
                          bandwidth.audio.recv.push(stats.audio.receiving.bytes * 8);
                          bandwidth.video.send.push(stats.video.sending.bytes * 8);
                          bandwidth.video.recv.push(stats.video.receiving.bytes * 8);
                      }
                      currentBlock++;
                      if (currentBlock === self._bandwidthAdjuster.interval) {
                          currentBlock = 0;
                          var totalAudioBw = formatTotalFn(bandwidth.audio.send);
                          var totalVideoBw = formatTotalFn(bandwidth.video.send);
                          if (!self._bandwidthAdjuster.useUploadBwOnly) {
                              totalAudioBw += formatTotalFn(bandwidth.audio.recv);
                              totalVideoBw += formatTotalFn(bandwidth.video.recv);
                              totalAudioBw = totalAudioBw / 2;
                              totalVideoBw = totalVideoBw / 2;
                          }
                          totalAudioBw = parseInt((totalAudioBw * (self._bandwidthAdjuster.limitAtPercentage / 100)) / 1000, 10);
                          totalVideoBw = parseInt((totalVideoBw * (self._bandwidthAdjuster.limitAtPercentage / 100)) / 1000, 10);
                          bandwidth = {
                              audio: { send: [], recv: [] },
                              video: { send: [], recv: [] }
                          };
                          self.refreshConnection(targetMid, {
                              bandwidth: { audio: totalAudioBw, video: totalVideoBw }
                          });
                      }
                  }, true, true);
              }, 1000);
          }
      };
    }

    self._handleNegotiationStats('set_' + sessionDescription.type, targetMid, sessionDescription, false);
    self._trigger('handshakeProgress', sessionDescription.type, targetMid);

    if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER) {
      pc.setAnswer = 'local';
    } else {
      pc.setOffer = 'local';
    }

    if (!self._initOptions.enableIceTrickle && !pc.gathered) {
      log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
        'Local session description sending is halted to complete ICE gathering.']);
      return;
    }

    var messageToSend = {
      type: sessionDescription.type,
      sdp: sessionDescription.sdp,
      mid: self._user.sid,
      target: targetMid,
      rid: self._room.id,
      userInfo: self._getUserInfo(targetMid),
    };

    pc.processingLocalSDP = messageToSend.type === self.HANDSHAKE_PROGRESS.OFFER;

    var updateTransceiverMidFromLocalSDP = function () {
      var mediaMids = self._getTransceiverMid(sessionDescription);
      var mediaIds = Object.keys(self._peerMedias[self._user.sid]);
      var audioMids = mediaMids.audio;
      var videoMids = mediaMids.video;

      for (var i = 0; i < mediaIds.length; i++) {
        var mediaInfo = self._peerMedias[self._user.sid][mediaIds[i]];

        for (var a = 0; a < audioMids.length; a++) {
          if (audioMids[a].streamId === mediaInfo.streamId && (audioMids[a].direction === 'sendonly' || audioMids[a].direction === 'sendrecv')) {
            mediaInfo.transceiverMid = audioMids[a].transceiverMid;
            break;
          }
        }

        for (var v = 0; v < videoMids.length; v++) {
          if (videoMids[v].streamId === mediaInfo.streamId && (videoMids[v].direction === 'sendonly' || videoMids[v].direction === 'sendrecv')) {
            mediaInfo.transceiverMid = videoMids[v].transceiverMid;
            break;
          }
        }
      }
    };

    var getMediaInfoList = function () {
      var mediaInfoList = [];
      var peerMedia = clone(self._peerMedias[self._user.sid]);
      var mediaIds = Object.keys(peerMedia);
      for (var i = 0; i < mediaIds.length; i++) {
        delete peerMedia[mediaIds[i]].streamId;
        delete peerMedia[mediaIds[i]].trackId;
        mediaInfoList.push(peerMedia[mediaIds[i]]);
      }

      return mediaInfoList;
    };

    if (sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER) {
      messageToSend.weight = self._peerPriorityWeight;
    }

    updateTransceiverMidFromLocalSDP();
    messageToSend.mediaInfoList = getMediaInfoList();

    // Merging Restart and Offer messages. The already present keys in offer message will not be overwritten.
    // Only news keys from mergeMessage are added.
    if (mergeMessage && Object.keys(mergeMessage).length) {
      var keys = Object.keys(mergeMessage);
      var currentMessageKeys = Object.keys(messageToSend);
      for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
        var key = keys[keyIndex];
        if (currentMessageKeys.indexOf(key) === -1) {
          messageToSend[key] = mergeMessage[key];
        }
      }
    }

    self._sendChannelMessage(messageToSend);
    self._handleNegotiationStats(sessionDescription.type, targetMid, sessionDescription, false);
  };

  var onErrorCbFn = function(error) {
    log.error([targetMid, 'RTCSessionDescription', sessionDescription.type, 'Local description failed setting ->'], error);

    pc.processingLocalSDP = false;

    self._handleNegotiationStats('error_set_' + sessionDescription.type, targetMid, sessionDescription, false, error);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  };

  if (sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER) {
    self._bufferedLocalOffer[targetMid] = sessionDescription;
    onSuccessCbFn();
  } else {
    pc.setLocalDescription(new RTCSessionDescription(sessionDescription), onSuccessCbFn, onErrorCbFn);
  }
};

Skylink.prototype.renegotiateIfNeeded = function (peerId) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var peerConnection = self._peerConnections[peerId];
    var pcSenders = peerConnection.getSenders();
    var senderGetStatsPromises = [];
    var savedSenders = self._currentRTCRTPSenders[peerId];
    var isRenegoNeeded = false;

    pcSenders.forEach(function(pcSender) {
      senderGetStatsPromises.push(pcSender.getStats());
    });
    var transmittingSenders = {};

    Promise.all(senderGetStatsPromises).then(function(reslovedResults) {
      reslovedResults.forEach(function(reports, senderIndex) {
        reports.forEach(function(report) {
          if (report && report.ssrc) {
            transmittingSenders[report.ssrc] = pcSenders[senderIndex];
          }
        });
      });

      var transmittingSendersKeys = Object.keys(transmittingSenders);

      if (transmittingSendersKeys.length !== savedSenders.length) {
        isRenegoNeeded = true;
      } else {
        var senderMatchedCount = 0;
        for (var tKey = 0; tKey < transmittingSendersKeys.length; tKey++) {
          var tSender = transmittingSenders[transmittingSendersKeys[tKey]];
          for (var sIndex = 0; sIndex < savedSenders.length; sIndex++) {
            var sSender = savedSenders[sIndex];
            if (tSender === sSender) {
              senderMatchedCount++;
              break;
            }
          }
        }
        isRenegoNeeded = senderMatchedCount !== transmittingSendersKeys.length;
      }
      resolve(isRenegoNeeded);
    });
  });

};
