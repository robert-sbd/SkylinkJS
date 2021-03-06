/* eslint-disable class-methods-use-this */
import {
  getParamValidity, getRoomStateByName, isAString, statelessGetUserMedia, isAObj, generateUUID,
} from '../utils/helpers';
import { dispatchEvent } from '../utils/skylinkEventManager';
import { streamEnded } from '../skylink-events';
import PeerConnection from '../peer-connection/index';
import PeerData from '../peer-data/index';
import PeerPrivileged from '../peer-privileged/index';
import ScreenSharing from '../features/screen-sharing/index';
import MediaStream from '../media-stream/index';
import Room from '../room/index';
import Recording from '../features/recording/index';
import RTMP from '../features/rtmp/index';
import AsyncMessaging from '../features/messaging/async-messaging';
import EncryptedMessaging from '../features/messaging/encrypted-messaging';
import Messaging from '../features/messaging';

/**
 * @classdesc This class lists all the public methods of Skylink.
 * @interface
 * @private
 */
class SkylinkPublicInterface {
  /**
   * @description Method that starts a room session.
   * @param {joinRoomOptions} [options] - The options available to join the room and configure the session.
   * @param {MediaStream} [prefetchedStream] - The pre-fetched media stream object obtained when the user calls {@link Skylink#getUserMedia|getUserMedia} method before {@link Skylink#joinRoom|joinRoom} method.
   * @return {Promise.<Array<MediaStream|null>>} Promise object with an array of <code>MediaStreams</code> or null if pre-fetched stream was
   * passed into <code>joinRoom</code> method. First item in array is MediaStream of kind audio and second item is MediaStream of kind video.
   * @example
   * Example 1: Calling joinRoom with options
   *
   * const joinRoomOptions = {
   *    audio: true,
   *    video: true,
   *    roomName: "Room_1",
   *    userData: {
   *        username: "GuestUser_1"
   *    },
   * };
   *
   * skylink.joinRoom(joinRoomOptions)
   *    .then((streams) => {
   *        if (streams[0]) {
   *          window.attachMediaStream(audioEl, streams[0]); // first item in array is an audio stream
   *        }
   *        if (streams[1]) {
   *          window.attachMediaStream(videoEl, streams[1]); // second item in array is a video stream
   *        }
   *    })
   *    .catch((error) => {
   *        // handle error
   *    });
   * @example
   * Example 2: Retrieving a pre-fetched stream before calling joinRoom
   *
   * // REF: {@link Skylink#getUserMedia|getUserMedia}
   * const prefetchedStream = skylink.getUserMedia();
   *
   * skylink.joinRoom(prefetchedStream)
   *    .catch((error) => {
   *    // handle error
   *    });
   * @alias Skylink#joinRoom
   */
  async joinRoom(options = {}, prefetchedStream) {
    return Room.joinRoom(options, prefetchedStream);
  }

  /**
   * @description Method that sends a message to peers via the data channel connection.
   * Consider using {@link Skylink#sendURLData|sendURLData} if you are sending large strings to peers.
   * @param {String} [roomName] - The name of the room the message is intended for.
   * When not provided, the message will be broadcast to all rooms where targetPeerId(s) are found (if provided).
   * Note when roomName is provided, targetPeerId should be provided as null.
   * @param {String|JSON} message - The message.
   * @param {String|Array} [targetPeerId] - The target peer id to send message to.
   * When provided as an Array, it will send the message to only peers which ids are in the list.
   * When not provided, it will broadcast the message to all connected peers with data channel connection in a room.
   * @example
   * Example 1: Broadcasting to all peers in all rooms
   *
   * const message = "Hello everyone!";
   *
   * skylink.sendP2PMessage(message);
   * @example
   * Example 2: Broadcasting to all peers in a room
   *
   * const message = "Hello everyone!";
   * const roomName = "Room_1";
   *
   * skylink.sendP2PMessage(message, null, roomName);
   * @example
   * Example 3: Sending message to a peer in all rooms
   *
   * const message = "Hello!";
   * const targetPeerId = "peerId";
   *
   * skylink.sendP2PMessage(message, targetPeerId);
   * @example
   * Example 4: Sending message to a peer in a room
   *
   * const message = "Hello!";
   * const targetPeerId = "peerId";
   * const roomName = "Room_1";
   *
   * skylink.sendP2PMessage(message, targetPeerId, roomName);
   * @example
   * Example 5: Sending message to selected Peers in a room
   *
   * const message = "Hello!";
   * const selectedPeers = ["peerId_1", "peerId_2"];
   * const roomName = "Room_1";
   *
   * skylink.sendP2PMessage(message, selectedPeers, roomName);
   * @example
   * // Listen for onIncomingMessage event
   * skylink.addEventListener(SkylinkEvents.ON_INCOMING_MESSAGE, (evt) => {
   *   const detail = evt.detail;
   *   if (detail.isSelf) {
   *     // handle message from self
   *   } else {
   *     // handle message from remote peer
   *   }
   * }
   * @fires {@link SkylinkEvents.event:onIncomingMessage|onIncomingMessage}
   * @alias Skylink#sendP2PMessage
   */
  sendP2PMessage(roomName = '', message = '', targetPeerId = '') {
    PeerConnection.sendP2PMessage(roomName, message, targetPeerId);
  }

  /**
   * @description Function that sends a message to peers via the Signaling socket connection.
   * @param {String} roomName - room name to send the message.
   * @param {String|JSON} message - The message.
   * @param {String|Array} [targetPeerId] - The target peer id to send message to.
   * - When provided as an Array, it will send the message to only peers which ids are in the list.
   * - When not provided, it will broadcast the message to all connected peers in the room.
   * @example
   * Example 1: Broadcasting to all peers
   *
   * let sendMessage = (roomName) => {
   *    const message = "Hi!";
   *    const selectedPeers = this.state[location]['selectedPeers'];
   *    this.skylink.sendMessage(roomName, message, selectedPeers);
   * }
   * @example
   * Example 2: Broadcasting to selected peers
   *
   * let sendMessage = (roomName) => {
   *    const message = "Hi all!";
   *    const selectedPeers = ["PeerID_1", "PeerID_2"];
   *    this.skylink.sendMessage(roomName, message, selectedPeers);
   * }
   * @fires {@link SkylinkEvents.event:onIncomingMessage|onIncomingMessage}
   * @alias Skylink#sendMessage
   * @since 0.4.0
   */
  sendMessage(roomName = '', message = '', targetPeerId = '') {
    Messaging.sendMessage(roomName, message, targetPeerId);
  }

  /**
   * @description Method that retrieves the message history from server if Persistent Message feature is enabled for the key.
   * @param {String} roomName - The name of the room.
   * @example
   * Example 1: Retrieving stored messages
   *
   * // add event listener to catch storedMessages event
   * SkylinkEventManager.addEventListener(SkylinkConstants.EVENTS.STORED_MESSAGES, (evt) => {
   *    const { storedMessages } = evt.detail;
   *    storedMessages.content.forEach((message) => {
   *      // do something
   *    })
   * });
   *
   * let getStoredMessages = (roomName) => {
   *    this.skylink.getStoredMessages(roomName);
   * }
   * @fires {@link SkylinkEvents.event:storedMessages|storedMessages}
   * @alias Skylink#getStoredMessages
   * @since 2.1
   */
  getStoredMessages(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      new AsyncMessaging(roomState).getStoredMessages();
    }
  }

  /**
   * @description Method that gets the list of connected peers in the room.
   * @param {String} roomName - The name of the room.
   * @return {JSON.<String, peerInfo>|null} <code>peerInfo</code> keyed by peer id. Additional <code>isSelf</code> flag to determine if peer is user or not. Null is returned if room has not been created.
   * @example
   * Example 1: Get the list of currently connected peers in the same room
   *
   * const peers = skylink.getPeersInRoom();
   * @alias Skylink#getPeersInRoom
   */
  getPeersInRoom(roomName) {
    if (getParamValidity(roomName, 'roomName', 'getPeersInRoom')) {
      return PeerConnection.getPeersInRoom(roomName);
    }

    return null;
  }

  /**
   * @description Method that returns the user / peer current session information.
   * @param {String} roomName - The name of the room.
   * @param {String|null} [peerId] The peer id to return the current session information from.
   * - When not provided or that the peer id is does not exists, it will return
   *   the user current session information.
   * @return {peerInfo|null} The user / peer current session information.
   * @example
   * Example 1: Get peer current session information
   *
   * const peerPeerInfo = skylink.getPeerInfo(peerId);
   * @example
   * Example 2: Get user current session information
   *
   * const userPeerInfo = skylink.getPeerInfo();
   * @alias Skylink#getPeerInfo
   */
  getPeerInfo(roomName, peerId = null) {
    const roomState = getRoomStateByName(roomName);
    if (peerId && roomState) {
      return PeerData.getPeerInfo(peerId, roomState.room);
    }

    if (!peerId && roomState) {
      return PeerData.getCurrentSessionInfo(roomState.room);
    }

    return null;
  }

  /**
   * @description Method that returns the user / peer current custom data.
   * @param {String} roomName - The room name.
   * @param {String} [peerId] - The peer id to return the current custom data from.
   * - When not provided or that the peer id is does not exists, it will return
   *   the user current custom data.
   * @return {Object|null} The user / peer current custom data.
   * @example
   * Example 1: Get peer current custom data
   *
   * const peerUserData = skylink.getUserData(peerId);
   * @example
   * Example 2: Get user current custom data
   *
   * const userUserData = skylink.getUserData();
   * @alias Skylink#getUserData
   */
  getUserData(roomName, peerId) {
    const roomState = getRoomStateByName(roomName);
    if (roomState && roomState.room) {
      return PeerData.getUserData(roomState, peerId);
    }

    return null;
  }

  /**
   * @description Method that overwrites the user current custom data.
   * @param {String} roomName - The room name.
   * @param {JSON|String} userData - The updated custom data.
   * @fires {@link SkylinkEvents.event:peerUpdated|peerUpdatedEvent} event if peer is in room with <code>isSelf=true</code>.
   * @example
   * Example 1: Update user custom data after joinRoom()
   *
   * // add event listener to catch setUserData changes
   * SkylinkEventManager.addEventListener(SkylinkConstants.peerUpdated, (evt) => {
   *    const { detail } = evt;
   *   // do something
   * });
   *
   * const userData = "afterjoin";
   * skylink.setUserData(userData);
   * @alias Skylink#setUserData
   */
  setUserData(roomName, userData) {
    const roomState = getRoomStateByName(roomName);
    if (roomState && roomState.room) {
      return PeerData.setUserData(roomState.room, userData);
    }

    return null;
  }

  /**
   * @description Method that retrieves peer connection bandwidth and ICE connection stats.
   * <blockquote class="info">
   * Note that this is not well supported in the Edge browser.
   * </blockquote>
   * @description Method that retrieves peer connection bandwidth and ICE connection stats.
   * @param {String} roomName - The room name.
   * @param {String|Array} [peerId] The target peer id to retrieve connection stats from.
   * - When provided as an Array, it will retrieve all connection stats from all the peer ids provided.
   * - When not provided, it will retrieve all connection stats from the currently connected peers in the room.
   * @return {Promise<Array.<object.<String|statistics>>>}
   * @example
   * Example 1: Retrieving connection statistics from all peers in a room
   *
   * skylink.getConnectionStatus("Room_1")
   *  .then((statistics) => {
   *    // handle statistics
   *  }
   *  .catch((error) => {
   *    // handle error
   *  }
   * @example
   * Example 2: Retrieving connection statistics from selected peers
   *
   * const selectedPeers = ["peerId_1", "peerId_2"];
   * skylink.getConnectionStatus("Room_1", selectedPeers)
   *  .then((statistics) => {
   *    // handle statistics
   *  }
   *  .catch((error) => {
   *    // handle error
   *  }
   * @alias Skylink#getConnectionStats
   */
  getConnectionStatus(roomName, peerId) {
    const roomState = getRoomStateByName(roomName);

    return PeerConnection.getConnectionStatus(roomState, peerId);
  }

  /**
   * @description Method that retrieves the list of peer ids from rooms within the same App space.
   * <blockquote class="info">
   *   Note that this feature requires <code>"isPrivileged"</code> flag to be enabled for the App Key
   *   provided in the {@link initOptions}, as only Users connecting using
   *   the App Key with this flag enabled (which we call privileged Users / peers) can retrieve the list of
   *   peer ids from rooms within the same App space.
   *   {@link http://support.temasys.io/support/solutions/articles/12000012342-what-is-a-privileged-key-|What is a privileged key?}
   * </blockquote>
   * @param {String} roomName - The room name
   * @param {Boolean} [showAll=false] - The flag if Signaling server should also return the list of privileged peer ids.
   * By default, the Signaling server does not include the list of privileged peer ids in the return result.
   * @return {Promise.<Object.<String, Array<String>>>} peerList - Array of peer ids, keyed by room name.
   * @fires {@link SkylinkEvents.event:getPeersStateChange|getPeersStateChangeEvent} with parameter payload <code>state=ENQUIRED</code> upon calling <code>getPeers</code> method.
   * @fires {@link SkylinkEvents.event:getPeersStateChange|getPeersStateChangeEvent} with parameter payload <code>state=RECEIVED</code> when peer list is received from Signaling server.
   * @example
   * Example 1: Retrieve un-privileged peers
   *
   * skylink.getPeers(location)
   *  .then((result) => {
   *      // do something
   *  })
   *  .catch((error) => {
   *      // handle error
   *  })
   *
   * Example 2: Retrieve all (privileged and un-privileged) peers
   *
   * skylink.getPeers(location, true)
   *  .then((result) => {
   *      // do something
   *  })
   *  .catch((error) => {
   *      // handle error
   *  })
   * @alias Skylink#getPeers
   * @since 0.6.1
   */
  getPeers(roomName, showAll = false) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return PeerPrivileged.getPeerList(roomState.room, showAll);
    }

    return null;
  }

  /**
   * @typedef {Object.<String, Object>} peersStreamsInfo
   * @property {Object.<String, Object>} #peerId - Peer streams info keyed by peer id.
   * @property {Boolean} #peerId.isSelf - The flag if the peer is local or remote.
   * @property {MediaStream} #peerId.#streamId - streams keyed by stream id.
  /**
   * @description Method that returns the list of connected peers streams in the room both user media streams and screen share streams.
   * @param {String} roomName - The room name.
   * @param {Boolean} [includeSelf=true] - The flag if self streams are included.
   * @return {JSON.<String, peersStreamsInfo>} - The list of peer stream objects keyed by peer id.
   * @example
   * Example 1: Get the list of current peers streams in the same room
   *
   * const streams = skylink.getPeersStreams("Room_1");
   * @alias Skylink#getPeersStreams
   * @since 0.6.16
   */
  getPeersStreams(roomName, includeSelf = true) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return PeerData.getPeersStreams(roomState, includeSelf);
    }
    return null;
  }

  /**
   * @typedef {Object} dataChannelInfo
   * @property {String} channelName - The data channel id.
   * @property {String} channelProp - The data channel property.
   * @property {String} channelType - The data channel type.
   * @property {String} currentTransferId - The data channel connection
   *   current progressing transfer session. Defined as <code>null</code> when there is
   *   currently no transfer session progressing on the data channel connection
   * @property {String} currentStreamId - The data channel connection
   *   current data streaming session id. Defined as <code>null</code> when there is currently
   *   no data streaming session on the data channel connection.
   * @property {String} readyState - The data channel connection readyState.
   * @property {String} bufferedAmountLow - The data channel buffered amount.
   * @property {String} bufferedAmountLowThreshold - The data channel
   *   buffered amount threshold.
   */
  /**
   * @description Method that gets the current list of connected peers data channel connections in the room.
   * @param {String} roomName - The room name.
   * @return {Object.<string, Object.<String, dataChannelInfo>>} - The list of peer data channels keyed by peer id, keyed by data channel id.
   * @example
   * Example 1: Get the list of current peers data channels in the same room
   *
   * const channels = skylink.getPeersDataChannels("Room_1");
   * @alias Skylink#getPeersDataChannels
   * @since 0.6.18
   */
  getPeersDataChannels(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return PeerData.getPeersDataChannels(roomState);
    }
    return null;
  }

  /**
   * @typedef {Object} customSettings
   * @property {Object} settings - The peer stream and data settings.
   * @property {Boolean|JSON} settings.data - The flag if peer has any data channel connections enabled.
   *   If <code>isSelf</code> value is <code>true</code>, this determines if user allows
   *   data channel connections, else if value is <code>false</code>, this determines if peer has any active
   *   data channel connections (where {@link SkylinkEvents.event:onDataChannelStateChanged|onDataChannelStateChangedEvent}
   *   triggers <code>state</code> as <code>OPEN</code> and <code>channelType</code> as
   *   <code>MESSAGING</code> for peer) with peer.
   * @property {Boolean|JSON} settings.audio - The peer stream audio settings.
   *   When defined as <code>false</code>, it means there is no audio being sent from peer.
   *   When defined as <code>true</code>, the <code>settings.audio.stereo</code> value is
   *   considered as <code>false</code> and the <code>settings.audio.exactConstraints</code>
   *   value is considered as <code>false</code>.
   * @property {Boolean} settings.audio.stereo - The flag if stereo band is configured
   *   when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for receiving audio data.
   * @property {Boolean} [settings.audio.usedtx]
   *   Note that this feature might not work depending on the browser support and implementation.
   *   The flag if DTX (Discontinuous Transmission) is configured when encoding audio codec
   *   is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   This might help to reduce bandwidth it reduces the bitrate during silence or background noise.
   *   When not defined, the default browser configuration is used.
   * @property {Boolean} [settings.audio.useinbandfec]
   *   Note that this feature might not work depending on the browser support and implementation.
   *   The flag if capability to take advantage of in-band FEC (Forward Error Correction) is
   *   configured when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   This might help to reduce the harm of packet loss by encoding information about the previous packet.
   *   When not defined, the default browser configuration is used.
   * @property {Number} [settings.audio.maxplaybackrate]
   *   Note that this feature might not work depending on the browser support and implementation.
   *   The maximum output sampling rate rendered in Hertz (Hz) when encoding audio codec is
   *   <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   This value must be between <code>8000</code> to <code>48000</code>.
   *   When not defined, the default browser configuration is used.
   * @property {Boolean} settings.audio.echoCancellation - The flag if echo cancellation is enabled for audio tracks.
   * @property {Array} [settings.audio.optional] The peer stream <code>navigator.getUserMedia()</code> API
   *   <code>audio: { optional [..] }</code> property.
   * @property {String} [settings.audio.deviceId] - The peer stream audio track source id of the device used.
   * @property {Boolean} settings.audio.exactConstraints - The flag if peer stream audio track is sending exact
   *   requested values of <code>settings.audio.deviceId</code> when provided.
   * @property {Boolean|JSON} settings.video - The peer stream video settings.
   *   When defined as <code>false</code>, it means there is no video being sent from peer.
   *   When defined as <code>true</code>, the <code>settings.video.screenshare</code> value is
   *   considered as <code>false</code>  and the <code>settings.video.exactConstraints</code>
   *   value is considered as <code>false</code>.
   * @property {JSON} [settings.video.resolution] - The peer stream video resolution.
   *   [Rel: {@link SkylinkConstants.VIDEO_RESOLUTION|VIDEO_RESOLUTION}]
   * @property {Number|JSON} settings.video.resolution.width - The peer stream video resolution width or
   *   video resolution width settings.
   *   When defined as a JSON Object, it is the user set resolution width settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).
   * @property {Number|JSON} settings.video.resolution.height - The peer stream video resolution height or
   *   video resolution height settings.
   *   When defined as a JSON Object, it is the user set resolution height settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).
   * @property {Number|JSON} [settings.video.frameRate] - The peer stream video
   *   <a href="https://en.wikipedia.org/wiki/Frame_rate">frameRate</a> per second (fps) or video frameRate settings.
   *   When defined as a JSON Object, it is the user set frameRate settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).
   * @property {Boolean} settings.video.screenshare - The flag if peer stream is a screensharing stream.
   * @property {Array} [settings.video.optional] - The peer stream <code>navigator.getUserMedia()</code> API
   *   <code>video: { optional [..] }</code> property.
   * @property {String} [settings.video.deviceId] - The peer stream video track source id of the device used.
   * @property {Boolean} settings.video.exactConstraints The flag if peer stream video track is sending exact
   *   requested values of <code>settings.video.resolution</code>,
   *   <code>settings.video.frameRate</code> and <code>settings.video.deviceId</code>
   *   when provided.
   * @property {String|JSON} [settings.video.facingMode] - The peer stream video camera facing mode.
   *   When defined as a JSON Object, it is the user set facingMode settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).
   * @property {Object} settings.bandwidth The maximum streaming bandwidth sent from peer.
   * @property {Number} [settings.bandwidth.audio] - The maximum audio streaming bandwidth sent from peer.
   * @property {Number} [settings.bandwidth.video] - The maximum video streaming bandwidth sent from peer.
   * @property {Number} [settings.bandwidth.data] - The maximum data streaming bandwidth sent from peer.
   * @property {Object} settings.googleXBandwidth
   *   Note that this feature might not work depending on the browser support and implementation,
   *   and its properties and values are only defined for user's end and cannot be viewed
   *   from peer's end (when <code>isSelf</code> value is <code>false</code>).
   *   The experimental google video streaming bandwidth sent to peers.
   * @property {Number} [settings.googleXBandwidth.min] - The minimum experimental google video streaming bandwidth sent to peers.
   * @property {Number} [settings.googleXBandwidth.max] - The maximum experimental google video streaming bandwidth sent to peers.
   * @property {Object} mediaStatus The peer streaming media status.
   * @property {Boolean} mediaStatus.audioMuted -  The value of the audio status.
   *   <small>If peer <code>mediaStatus</code> is <code>-1</code>, audio is not present in the stream. If peer <code>mediaStatus</code> is <code>1</code>, audio is present
   *   in the stream and active (not muted). If peer <code>mediaStatus</code> is <code>0</code>, audio is present in the stream and muted.
   *   </small>
   * @property {Boolean} mediaStatus.videoMuted - The value of the video status.
   *   <small>If peer <code>mediaStatus</code> is <code>-1</code>, video is not present in the stream. If peer <code>mediaStatus</code> is <code>1</code>, video is present
   *   in the stream and active (not muted). If peer <code>mediaStatus</code> is <code>0</code>, video is present in the stream and muted.
   *   </small>
   */
  /**
   * @description Method that gets the list of current custom peer settings sent and set.
   * @param {String} roomName - The room name.
   * @return {Object.<String, customSettings>|null} - The peer custom settings keyed by peer id.
   * @example
   * Example 1: Get the list of current peer custom settings from peers in a room.
   *
   * const currentPeerSettings = skylink.getPeersCustomSettings("Room_1");
   * @alias Skylink#getPeersCustomSettings
   * @since 0.6.18
   */
  getPeersCustomSettings(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return PeerData.getPeersCustomSettings(roomState);
    }

    return null;
  }

  /**
   * @description Method that refreshes the main messaging data channel.
   * @param {String} roomName - The room name.
   * @param {String} peerId - The target peer id of the peer data channel to refresh.
   * @return {null}
   * @example
   * Example 1: Initiate refresh data channel
   *
   * skylink.refreshDatachannel("Room_1", "peerID_1");
   *
   * @alias Skylink#refreshDatachannel
   * @since 0.6.30
   */
  refreshDatachannel(roomName, peerId) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return PeerConnection.refreshDataChannel(roomState, peerId);
    }

    return null;
  }

  /**
   * @description Method that refreshes peer connections to update with the current streaming.
   * <blockquote class="info">
   *   Note that Edge browser does not support renegotiation.
   *   For MCU enabled peer connections with <code>options.mcuUseRenegoRestart</code> set to <code>false</code>
   *   in the {@link initOptions}, the restart method may differ, you
   *   may learn more about how to workaround it in this article
   *   {@link http://support.temasys.io/support/discussions/topics/12000002853|here}.
   *   For restarts with peers connecting from Android, iOS or C++ SDKs, restarts might not work as written in this article
   *   {@link http://support.temasys.io/support/discussions/topics/12000005188|here}.
   *   Note that this functionality should be used when peer connection stream freezes during a connection.
   *   For a better user experience for only MCU enabled peer connections, the method is throttled when invoked many
   *   times in less than the milliseconds interval configured in {@link initOptions}.
   * </blockquote>
   * @param {String} roomName - The name of the room.
   * @param {String|Array} [targetPeerId] <blockquote class="info">
   *   Note that this is ignored if MCU is enabled for the App Key provided in
   *   {@link initOptions}. <code>refreshConnection()</code> will "refresh"
   *   all peer connections. </blockquote>
   *   - The target peer id to refresh connection with.
   * - When provided as an Array, it will refresh all connections with all the peer ids provided.
   * - When not provided, it will refresh all the currently connected peers in the room.
   * @param {Boolean} [iceRestart=false] <blockquote class="info">
   *   Note that this flag will not be honoured for MCU enabled peer connections where
   *   <code>options.mcuUseRenegoRestart</code> flag is set to <code>false</code> as it is not necessary since for MCU
   *   "restart" case is to invoke {@link Skylink#joinRoom}again, or that it is
   *   not supported by the MCU.</blockquote>
   *   The flag if ICE connections should restart when refreshing peer connections.
   *   This is used when ICE connection state is <code>FAILED</code> or <code>DISCONNECTED</code>, which state
   *   can be retrieved with the {@link SkylinkEvents.event:iceConnectionState|iceConnectionStateEvent}
   * @param {JSON} [options] <blockquote class="info">
   *   Note that for MCU connections, the <code>bandwidth</code> or <code>googleXBandwidth</code>
   *   settings will override for all peers or the current room connection session settings.</blockquote>
   *   The custom peer configuration settings.
   * @param {JSON} [options.bandwidth] The configuration to set the maximum streaming bandwidth to send to peers.
   *   Object signature follows {@link Skylink#joinRoom}
   *   <code>options.bandwidth</code> settings.
   * @param {JSON} [options.googleXBandwidth] The configuration to set the experimental google
   *   video streaming bandwidth sent to peers.
   *   Object signature follows {@link Skylink#joinRoom}
   *   <code>options.googleXBandwidth</code> settings.
   * @return {Promise.<refreshConnectionResolve>} - The Promise will always resolve.
   * @example
   * Example 1: Refreshing a peer connection
   *
   * skylink.refreshConnection(roomName, peerId)
   * .then((result) => {
   *   const failedRefreshIds = Object.keys(result.refreshErrors);
   *   failedRefreshIds.forEach((peerId) => {
   *     // handle error
   *   });
   * });
   *
   * @example
   * Example 2: Refreshing a list of peer connections
   * let selectedPeers = ["peerID_1", "peerID_2"];
   *
   * skylink.refreshConnection(roomName, selectedPeers)
   * .then((result) => {
   *   const failedRefreshIds = Object.keys(result.refreshErrors);
   *   failedRefreshIds.forEach((peerId) => {
   *     // handle error
   *   });
   * });
   * @example
   * Example 3: Refreshing all peer connections
   *
   * skylink.refreshConnection(roomName)
   * .then((result) => {
   *   const failedRefreshIds = Object.keys(result.refreshErrors);
   *   failedRefreshIds.forEach((peerId) => {
   *    // handle error
   *   });
   * });
   * @alias Skylink#refreshConnection
   * @since 0.5.5
   */
  refreshConnection(roomName, targetPeerId, iceRestart, options) {
    const roomState = getRoomStateByName(roomName);

    return PeerConnection.refreshConnection(roomState, targetPeerId, iceRestart, options);
  }

  /**
   * @description Method that returns starts screenshare and returns the stream.
   * @param {String} roomName - The room name.
   * @param {Boolean} replaceUserMediaStream - The flag if screenshare replaces the <code>userMedia</code> stream.
   * @param {String} [streamId] - The stream id of the <code>userMedia</code> stream to replace. streamId must be provided if there is more than
   * one <code>userMedia</code> stream on the peer connection and replaceUserMediaStream is true.
   * @return {MediaStream|null} - The screen share stream.
   * @example
   * Example 1: Replace selected stream with screen share stream
   *
   * let shareScreenReplace = () => {
   *    // Retrieve all userMedia streams
   *    const streamList = skylink.getStreams(roomName);
   *    skylink.shareScreen(roomName, true, Object.keys(streamList.userMedia)[0]).then((screenStream) => {
   *      window.attachMediaStream(localVideoElement, screenStream);
   *    });
   * }
   * @alias Skylink#shareScreen
   * @since 2.0.0
   */
  shareScreen(roomName, streamId) {
    const replaceUserMediaStream = false;
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      const screenSharing = new ScreenSharing(roomState);
      return screenSharing.start(replaceUserMediaStream, streamId);
    }

    return null;
  }

  /**
   * @description Method that returns the screenshare stream id of peers.
   * @param {String} roomName - The room name.
   * @return {Object.<String, MediaStream>|null} screenshareStream - The peer screen share stream keyed by peer id if there is one.
   * @alias Skylink#getPeersScreenshare
   * @since 2.0.0
   */
  getPeersScreenshare(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return PeerConnection.getPeerScreenshare(roomState);
    }

    return null;
  }

  /**
   * <blockquote class="info">
   *   For a better user experience, the functionality is throttled when invoked many times in less
   *   than the milliseconds interval configured in the {@link initOptions}.
   * </blockquote>
   * @description Method that retrieves camera stream.
   * @param {String|null} roomName - The room name.
   * - If no roomName is passed or <code>getUserMedia()</code> is called before {@link Skylink#joinRoom|joinRoom}, the returned stream will not be associated with a room. The stream must be maintained independently.
   * To stop the stream, call {@link Skylink#stopPrefetchedStream|stopPrefetchedStream} method.
   * @param {JSON} [options] - The camera stream configuration options.
   * - When not provided, the value is set to <code>{ audio: true, video: true }</code>.
   *   To fallback to retrieve audio track only when retrieving of audio and video tracks failed,
   *   enable the <code>audioFallback</code> flag in the {@link initOptions}.
   * @param {Boolean} [options.useExactConstraints=false] <blockquote class="info">
   *   Note that by enabling this flag, exact values will be requested when retrieving camera stream,
   *   but it does not prevent constraints related errors. By default when not enabled,
   *   expected mandatory maximum values (or optional values for source id) will requested to prevent constraints related
   *   errors, with an exception for <code>options.video.frameRate</code> option in Safari and IE (any plugin-enabled) browsers,
   *   where the expected maximum value will not be requested due to the lack of support.</blockquote>
   *   The flag if <code>getUserMedia()</code> should request for camera stream to match exact requested values of
   *   <code>options.audio.deviceId</code> and <code>options.video.deviceId</code>, <code>options.video.resolution</code>
   *   and <code>options.video.frameRate</code> when provided.
   * @param {Boolean|JSON} [options.audio=false] <blockquote class="info">
   *    Note that the current Edge browser implementation does not support the <code>options.audio.optional</code>,
   *    <code>options.audio.deviceId</code>, <code>options.audio.echoCancellation</code>.</blockquote>
   *    The audio configuration options.
   * @param {Boolean} [options.audio.stereo=false] <blockquote class="info"><b>Deprecation Warning!</b>
   *   This property has been deprecated. Configure this with the <code>options.codecParams.audio.opus.stereo</code> and
   *   the <code>options.codecParams.audio.opus["sprop-stereo"]</code>
   *   parameter in the {@link initOptions} instead. If the
   *   <code>options.codecParams.audio.opus.stereo</code> or <code>options.codecParams.audio.opus["sprop-stereo"]</code>
   *   is configured, this overrides the <code>options.audio.stereo</code> setting.</blockquote>
   *   The flag if OPUS audio codec stereo band should be configured for sending encoded audio data.
   *   When not provided, the default browser configuration is used.
   * @param {Boolean} [options.audio.usedtx] <blockquote class="info"><b>Deprecation Warning!</b>
   *   This property has been deprecated. Configure this with the <code>options.codecParams.audio.opus.stereo</code>
   *   parameter in the {@link initOptions} instead. If the
   *   <code>options.codecParams.audio.opus.stereo</code> is configured, this overrides the
   *   <code>options.audio.stereo</code> setting.  Note that this feature might
   *   not work depending on the browser support and implementation.</blockquote>
   *   The flag if OPUS audio codec should enable DTX (Discontinuous Transmission) for sending encoded audio data.
   *   This might help to reduce bandwidth as it reduces the bitrate during silence or background noise, and
   *   goes hand-in-hand with the <code>options.voiceActivityDetection</code> flag in <a href="#method_joinRoom">
   *   <code>joinRoom()</code> method</a>.
   *   When not provided, the default browser configuration is used.
   * @param {Boolean} [options.audio.useinbandfec] <blockquote class="info"><b>Deprecation Warning!</b>
   *   This property has been deprecated. Configure this with the <code>options.codecParams.audio.opus.useinbandfec</code>
   *   parameter in the {@link initOptions} instead. If the
   *   <code>options.codecParams.audio.opus.useinbandfec</code> is configured, this overrides the
   *   <code>options.audio.useinbandfec</code> setting. Note that this parameter should only be used
   *   for debugging purposes only.</blockquote>
   *   The flag if OPUS audio codec has the capability to take advantage of the in-band FEC
   *   (Forward Error Correction) when sending encoded audio data.
   *   This helps to reduce the harm of packet loss by encoding information about the previous packet loss.
   *   When not provided, the default browser configuration is used.
   * @param {Number} [options.audio.maxplaybackrate] <blockquote class="info"><b>Deprecation Warning!</b>
   *   This property has been deprecated. Configure this with the <code>options.codecParams.audio.opus.maxplaybackrate</code>
   *   parameter in the {@link initOptions} instead. If the
   *   <code>options.codecParams.audio.opus.maxplaybackrate</code> is configured, this overrides the
   *   <code>options.audio.maxplaybackrate</code> setting.  Note that this feature might
   *   not work depending on the browser support and implementation.
   *   Note that this parameter should only be used for debugging purposes only.</blockquote>
   *   The OPUS audio codec maximum output sampling rate in Hz (hertz) that is is capable of receiving
   *   decoded audio data, to adjust to the hardware limitations and ensure that any sending audio data
   *   would not encode at a higher sampling rate specified by this.
   *   This value must be between <code>8000</code> to <code>48000</code>.
   *   When not provided, the default browser configuration is used.
   * @param {Boolean} [options.audio.mute=false] The flag if audio tracks should be muted upon receiving them.
   *   Providing the value as <code>false</code> sets <code>peerInfo.mediaStatus.audioMuted</code> to <code>1</code>,
   *   but when provided as <code>true</code>, this sets the <code>peerInfo.mediaStatus.audioMuted</code> value to
   *   <code>0</code> and mutes any existing <a href="#method_shareScreen">
   *   <code>shareScreen()</code> stream</a> audio tracks as well.
   * @param {Array} [options.audio.optional] <blockquote class="info">
   *   This property has been deprecated. "optional" constraints has been moved from specs.<br>
   *   Note that this may result in constraints related error when <code>options.useExactConstraints</code> value is
   *   <code>true</code>. If you are looking to set the requested source id of the audio track,
   *   use <code>options.audio.deviceId</code> instead.</blockquote>
   *   The <code>navigator.getUserMedia()</code> API <code>audio: { optional [..] }</code> property.
   * @param {String} [options.audio.deviceId] <blockquote class="info">
   *   Note this is currently not supported in Firefox browsers.
   *   </blockquote> The audio track source id of the device to use.
   *   The list of available audio source id can be retrieved by the {@link https://developer.
   * mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices}.
   * @param {Boolean} [options.audio.echoCancellation=true] <blockquote class="info">
   *   For Chrome/Opera/IE/Safari/Bowser, the echo cancellation @description Methodality may not work and may produce a terrible
   *   feedback. It is recommended to use headphones or other microphone devices rather than the device
   *   in-built microphones.</blockquote> The flag to enable echo cancellation for audio track.
   * @param {Boolean|JSON} [options.video=false] <blockquote class="info">
   *    Note that the current Edge browser implementation does not support the <code>options.video.optional</code>,
   *    <code>options.video.deviceId</code>, <code>options.video.resolution</code> and
   *    <code>options.video.frameRate</code>, <code>options.video.facingMode</code>.</blockquote>
   *   The video configuration options.
   * @param {Boolean} [options.video.mute=false] The flag if video tracks should be muted upon receiving them.
   *   Providing the value as <code>false</code> sets the <code>peerInfo.mediaStatus.videoMuted</code> value to
   *   <code>1</code>, but when provided as <code>true</code>, this sets the <code>peerInfo.mediaStatus.videoMuted</code> value to
   *   <code>0</code> and mutes any existing <a href="#method_shareScreen">
   *   <code>shareScreen()</code> stream</a> video tracks as well.
   * @param {JSON} [options.video.resolution] The video resolution.
   *   By default, <a href="#attr_VIDEO_RESOLUTION"><code>VGA</code></a> resolution option
   *   is selected when not provided.
   *   [Rel: {@link SkylinkConstants.VIDEO_RESOLUTION|VIDEO_RESOLUTION}]
   * @param {Number|JSON} [options.video.resolution.width] The video resolution width.
   * - When provided as a number, it is the video resolution width.
   * - When provided as a JSON, it is the <code>navigator.mediaDevices.getUserMedia()</code> <code>.width</code> settings.
   *   Parameters are <code>"ideal"</code> for ideal resolution width, <code>"exact"</code> for exact video resolution width,
   *   <code>"min"</code> for min video resolution width and <code>"max"</code> for max video resolution width.
   *   Note that this may result in constraints related errors depending on the browser/hardware supports.
   * @param {Number|JSON} [options.video.resolution.height] The video resolution height.
   * - When provided as a number, it is the video resolution height.
   * - When provided as a JSON, it is the <code>navigator.mediaDevices.getUserMedia()</code> <code>.height</code> settings.
   *   Parameters are <code>"ideal"</code> for ideal video resolution height, <code>"exact"</code> for exact video resolution height,
   *   <code>"min"</code> for min video resolution height and <code>"max"</code> for max video resolution height.
   *   Note that this may result in constraints related errors depending on the browser/hardware supports.
   * @param {Number|JSON} [options.video.frameRate] The video {@link https://en.wikipedia.org/wiki/Frame_rate} per second (fps).
   * - When provided as a number, it is the video framerate.
   * - When provided as a JSON, it is the <code>navigator.mediaDevices.getUserMedia()</code> <code>.frameRate</code> settings.
   *   Parameters are <code>"ideal"</code> for ideal video framerate, <code>"exact"</code> for exact video framerate,
   *   <code>"min"</code> for min video framerate and <code>"max"</code> for max video framerate.
   *   Note that this may result in constraints related errors depending on the browser/hardware supports.
   * @param {Array} [options.video.optional] <blockquote class="info">
   *   This property has been deprecated. "optional" constraints has been moved from specs.<br>
   *   Note that this may result in constraints related error when <code>options.useExactConstraints</code> value is
   *   <code>true</code>. If you are looking to set the requested source id of the video track,
   *   use <code>options.video.deviceId</code> instead.</blockquote>
   *   The <code>navigator.getUserMedia()</code> API <code>video: { optional [..] }</code> property.
   * @param {String} [options.video.deviceId] <blockquote class="info">
   *   Note this is currently not supported in Firefox browsers.
   *   </blockquote> The video track source id of the device to use.
   *   The list of available video source id can be retrieved by the {@link https://developer.
   * mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices}.
   * @param {String|JSON} [options.video.facingMode] The video camera facing mode.
   *   The list of available video source id can be retrieved by the {@link https://developer.mozilla.org
   *   /en-US/docs/Web/API/MediaTrackConstraints/facingMode}.
   * @return {Promise<MediaStream>} MediaStream
   * @example
   * Example 1: Get both audio and video after joinRoom
   *
   * skylink.getUserMedia(roomName, {
   *     audio: true,
   *     video: true,
   * }).then((stream) => // do something)
   * .catch((error) => // handle error);
   * @example
   * Example 2: Get only audio
   *
   * skylink.getUserMedia(roomName, {
   *     audio: true,
   *     video: false,
   * }).then((stream) => // do something)
   * .catch((error) => // handle error);
   * @example
   * Example 3: Configure resolution for video
   *
   * skylink.getUserMedia(roomName, {
   *     audio: true,
   *     video: { resolution: skylinkConstants.VIDEO_RESOLUTION.HD },
   * }).then((stream) => // do something)
   * .catch((error) => // handle error);
   * @example
   * Example 4: Configure stereo flag for OPUS codec audio (OPUS is always used by default)
   *
   * this.skylink.getUserMedia(roomName, {
   *     audio: {
   *         stereo: true,
   *     },
   *     video: true,
   * }).then((stream) => // do something)
   * .catch((error) => // handle error);
   * @example
   * Example 5: Get both audio and video before joinRoom
   *
   * // Note: the prefetched stream must be maintained independently
   * skylink.getUserMedia({
   *     audio: true,
   *     video: true,
   * }).then((stream) => // do something)
   * .catch((error) => // handle error);
   * @example
   * Example 6: Get media sources before joinRoom - only available on Chrome browsers
   *
   * const audioInputDevices = [];
   * const videoInputDevices = [];
   *
   * navigator.mediaDevices.enumerateDevices().then((devices) => {
   *   devices.forEach((device) => {
   *     if (device.kind === "audioinput") {
   *       audioInputDevices.push(device);
   *     }
   *
   *     if (device.kind === "videoinput") {
   *       videoInputDevices.push(device);
   *     }
   *   })
   * }).catch((error) => // handle error);
   *
   * skylink.getUserMedia(roomName, {
   *   audio: {
   *     deviceId: audioInputDevices[0].deviceId,
   *   },
   *   video: {
   *     deviceId: videoInputDevices[0].deviceId,
   *   }
   * }).then((stream) => // do something)
   * .catch((error) => // handle error);
   * @fires <b>If retrieval of fallback audio stream is successful:</b> <br/> - {@link SkylinkEvents.event:mediaAccessSuccess|mediaAccessSuccessEvent} with parameter payload <code>isScreensharing=false</code> and <code>isAudioFallback=false</code> if initial retrieval is successful.
   * @fires <b>If initial retrieval is unsuccessful:</b> <br/> Fallback to retrieve audio only stream is triggered (configured in {@link initOptions} <code>audioFallback</code>) <br/>&emsp; - {@link SkylinkEvents.event:mediaAccessFallback|mediaAccessFallbackEvent} with parameter payload <code>state=FALLBACKING</code>, <code>isScreensharing=false</code> and <code>isAudioFallback=true</code> and <code>options.video=true</code> and <code>options.audio=true</code>. <br/> No fallback to retrieve audio only stream <br/> - {@link SkylinkEvents.event:mediaAccessError|mediaAccessErrorEvent} with parameter payload <code>isScreensharing=false</code> and <code>isAudioFallbackError=false</code>.
   * @fires <b>If retrieval of fallback audio stream is successful:</b> <br/> - {@link SkylinkEvents.event:mediaAccessSuccess|mediaAccessSuccessEvent} with parameter payload <code>isScreensharing=false</code> and <code>isAudioFallback=true</code>.
   * @fires <b>If retrieval of fallback audio stream is unsuccessful:</b> <br/> - {@link SkylinkEvents.event:mediaAccessFallback|mediaAccessFallbackEvent} with parameter payload <code>state=ERROR</code>, <code>isScreensharing=false</code> and <code>isAudioFallback=true</code>. <br/> - {@link SkylinkEvents.event:mediaAccessError|mediaAccessErrorEvent} with parameter payload <code>isScreensharing=false</code> and <code>isAudioFallbackError=true</code>.
   * @alias Skylink#getUserMedia
   * @since 0.5.6
   */
  // eslint-disable-next-line consistent-return
  getUserMedia(roomName = null, options) {
    if (!roomName) {
      return statelessGetUserMedia(options);
    }

    if (isAString(roomName)) {
      const roomState = getRoomStateByName(roomName);
      if (roomState) {
        return MediaStream.getUserMediaLayer(roomState, options);
      }
    } else if (isAObj(roomName)) {
      return statelessGetUserMedia(roomName);
    }
  }

  /**
   * @description Method that stops the {@link Skylink#getUserMedia} stream that is called without roomName param or before {@link Skylink#joinRoom|joinRoom} is called.
   * @param {MediaStream} stream - The prefetched stream.
   * @return {null}
   * @fires {@link SkylinkEvents.event:streamEnded|streamEndedEvent}
   * @alias Skylink#stopPrefetchedStream
   * @since 2.0
   * @ignore
   */
  stopPrefetchedStream(stream) {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      dispatchEvent(streamEnded({
        room: null,
        peerId: null,
        peerInfo: null,
        isSelf: true,
        isScreensharing: false,
        streamId: stream.id,
      }));
    }

    return null;
  }

  /**
   * @description Method that stops the screen share stream returned from {@link Skylink#shareScreen|shareScreen} method.
   * @param {String} roomName - The room name.
   * @return {null}
   * @example
   * Example 1
   *
   * skylink.stopScreen(roomName);
   *
   * @fires {@link SkylinkEvents.event:mediaAccessStopped|mediaAccessStoppedEvent} with parameter payload <code>isScreensharing</code> value as <code>true</code> and <code>isAudioFallback</code> value as <code>false</code> if there is a screen stream
   * @fires {@link SkylinkEvents.event:streamEnded|streamEndedEvent} with parameter payload <code>isSelf</code> value as <code>true</code> and <code>isScreensharing</code> value as <code>true</code> if user is in the room
   * @fires {@link SkylinkEvents.event:peerUpdated|peerUpdatedEvent} with parameter payload <code>isSelf</code> value as <code>true</code>
   * @fires {@link SkylinkEvents.event:onIncomingStream|onIncomingStreamEvent} with parameter payload <code>isSelf</code> value as <code>true</code> and <code>stream</code> as {@link Skylink#getUserMedia} stream</a> if there is an existing <code>userMedia</code> stream
   * @alias Skylink#stopScreen
   * @since 0.6.0
   */
  stopScreen(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      const screenSharing = new ScreenSharing(roomState);
      screenSharing.stop();
    }

    return null;
  }

  /**
   * @description Method that stops the <code>userMedia</code> stream returned from {@link Skylink#getUserMedia|getUserMedia}</a> method.
   * @param {String} roomName - The room name.
   * @param {String} streamId - The stream id of the stream to stop. If streamId is not set, all <code>userMedia</code> streams will be stopped.
   * @return {Promise}
   * @example
   * skylink.stopStreams(roomName)
   * .then(() => // do some thing);
   * @fires {@link SkylinkEvents.event:mediaAccessStopped|mediaAccessStoppedEvent} with parameter payload <code>isSelf=true</code> and <code>isScreensharing=false</code> if there is a <code>getUserMedia</code> stream.
   * @fires {@link SkylinkEvents.event:streamEnded|streamEndedEvent} with parameter payload <code>isSelf=true</code> and <code>isScreensharing=false</code> if there is a <code>getUserMedia</code> stream and user is in a room.
   * @fires {@link SkylinkEvents.event:peerUpdated|peerUpdatedEvent} with parameter payload <code>isSelf=true</code>.
   * @alias Skylink#stopStreams
   * @since 0.5.6
   */
  stopStreams(roomName, streamId) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return MediaStream.stopStreams(roomState, streamId);
    }

    return null;
  }

  /**
   * @description Method that stops the room session.
   * @param {String} roomName  - The room name to leave.
   * @return {Promise.<String>}
   * @alias Skylink#leaveRoom
   * @since 0.5.5
   */
  leaveRoom(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return Room.leaveRoom(roomState);
    }

    return null;
  }

  /**
   * @description Method that stops all room sessions.
   * @return {Promise.<Array.<String>>}
   * @alias Skylink#leaveAllRooms
   * @since 2.0.0
   */
  leaveAllRooms() {
    return Room.leaveAllRooms();
  }

  /**
   * @description Method that starts a recording session.
   * <blockquote class="info">
   *   Note that this feature requires MCU and recording to be enabled for the App Key provided in
   *   {@link initOptions}. If recording feature is not available to
   *   be enabled in the {@link https://console.temasys.io|Temasys Developer Console}, please contact us on our support portal {@link http://support.temasys.io|here}.
   * </blockquote>
   * @param {String} roomName - The room name.
   * @return {Promise<String>} recordingId - The recording session id.
   * @example
   * Example 1: Start a recording session
   *
   * skylink.startRecording(roomName)
   * .then(recordingId => {
   *   // do something
   * })
   * .catch(error => {
   *   // handle error
   * });
   * @fires {@link SkylinkEvents.recordingState|recordingStateEvent} with payload <code>state=START</code> if recording has started successfully.
   * @fires {@link SkylinkEvents.recordingState|recordingStateEvent} with payload <code>error</code> if an error occurred during recording.
   * @alias Skylink#startRecording
   * @since 0.6.16
   */
  startRecording(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return Recording.start(roomState);
    }

    return null;
  }

  /**
   * @description Method that stops a recording session.
   * <blockquote class="info">
   *   <ul>
   *     <li>
   *      Note that this feature requires MCU and recording to be enabled for the App Key provided in the
   *      {@link initOptions}. If recording feature is not available to be enabled in the {@link https://console.temasys.io|Temasys Developer Console},
   *      please contact us on our support portal {@link http://support.temasys.io|here}.
   *    </li>
   *    <li>
   *      It is mandatory for the recording session to have elapsed for more than 4 minutes before calling <code>stopRecording</code> method.
   *    </li>
   *   </ul>
   * </blockquote>
   * @param {String} roomName - The room name.
   * @return {Promise<String>} recordingId - The recording session id.
   * @example
   * Example 1: Stop the recording session
   *
   * skylink.stopRecording(roomName)
   * .then(recordingId => {
   *   // do something
   * })
   * .catch(error => {
   *   // handle error
   * });
   * @fires {@link SkylinkEvents.recordingState|recordingStateEvent} with payload <code>state=STOP</code> if recording has stopped successfully.
   * @fires {@link SkylinkEvents.recordingState|recordingStateEvent} with payload <code>error</code> if an error occurred during recording.
   * @alias Skylink#stopRecording
   * @since 0.6.16
   */
  stopRecording(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return Recording.stop(roomState);
    }

    return null;
  }

  /**
   * @description Method that locks a room.
   * @param {String} roomName - The room name.
   * @return {Boolean}
   * @fires {@link SkylinkEvents.event:roomLock|roomLockEvent} with payload parameters <code>isLocked=true</code> when the room is successfully locked.
   * @example
   * // add event listener to listen for room locked state when peer tries to join a locked room
   * skylinkEventManager.addEventListener(SkylinkEvents.SYSTEM_ACTION, (evt) => {
   *   const { detail } = evt;
   *   if (detail.reason === SkylinkConstants.SYSTEM_ACTION.LOCKED') {
   *     // handle event
   *   }
   * }
   *
   * // add event listener to listen for room locked/unlocked event after calling lockRoom method
   * skylinkEventManager.addEventListener(SkylinkEvents.ROOM_LOCK, (evt) => {
   *   const { detail } = evt;
   *   if (detail.isLocked) {
   *     // handle room lock event
   *   } else {
   *     // handle room unlock event
   *   }
   * }
   *
   * skylink.lockRoom(roomName);
   * @alias Skylink#lockRoom
   * @since 0.5.0
   */
  lockRoom(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return Room.lockRoom(roomState);
    }

    return null;
  }

  /**
   * @description Method that unlocks a room.
   * @param {String} roomName - The room name.
   * @return {Boolean}
   * @fires {@link SkylinkEvents.event:roomLock|roomLockEvent} with payload parameters <code>isLocked=false</code> when the room is successfully locked.
   * @alias Skylink#unlockRoom
   * @since 0.5.0
   */
  unlockRoom(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return Room.unlockRoom(roomState);
    }

    return null;
  }

  /**
   * @typedef {Object} recordingSessions
   * @property {Object<string, Object>} #recordingId - The recording session keyed by recording id.
   * @property {Boolean} #recordingId.active - The flag that indicates if the recording session is currently active.
   * @property {String} #recordingId.state - The current recording state. [Rel: {@link SkylinkConstants.RECORDING_STATE|RECORDING_STATE}]
   * @property {String} #recordingId.startedStateTime - The recording session started DateTime in
   *   {@link https://en.wikipedia.org/wiki/ISO_8601|ISO}.Note that this value may not be
   *   very accurate as this value is recorded when the start event is received.
   * @property {String} #recordingId.endedDateTime - The recording session ended DateTime in
   *   {@link https://en.wikipedia.org/wiki/ISO_8601|ISO}.Note that this value may not be
   *   very accurate as this value is recorded when the stop event is received.
   *   Defined only after <code>state</code> has triggered <code>STOP</code>.
   * @property {String} #recordingId.mixingDateTime - The recording session mixing completed DateTime in
   *   {@link https://en.wikipedia.org/wiki/ISO_8601|ISO}.Note that this value may not be
   *   very accurate as this value is recorded when the mixing completed event is received.
   *   Defined only when <code>state</code> is <code>LINK</code>.
   * @property {String} #recordingId.links - The recording session links.
   *   Object signature matches the <code>link</code> parameter payload received in the
   *   {@link SkylinkEvents.event:recordingState|recordingStateEvent} event.
   * @property {Error} #recordingId.error - The recording session error.
   *   Defined only when <code>state</code> is <code>ERROR</code>.
   */
  /**
   * Gets the list of current recording sessions since user has connected to the room.
   * @description Method that retrieves the list of recording sessions.
   * <blockquote class="info">
   *   Note that this feature requires MCU and recording to be enabled for the App Key provided in
   *   {@link initOptions}. If recording feature is not available to be enabled in the {@link https://console.temasys.io|Temasys Developer Console},
   *   please contact us on our support portal {@link http://support.temasys.io|here}.
   * </blockquote>
   * @param {String} roomName - The room name.
   * @return {recordingSessions|{}} The list of recording sessions.
   * @example
   * Example 1: Get recording sessions
   *
   * skylink.getRecordings(roomName);
   * @alias Skylink#getRecordings
   * @since 0.6.16
   */
  getRecordings(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return Recording.getRecordings(roomState);
    }

    return null;
  }

  /**
   * @description Method that mutes both <code>userMedia</code> [{@link Skylink#getUserMedia|getUserMedia}] stream and
   * <code>screen</code> [{@link Skylink#shareScreen|shareScreen}] stream.
   * @param {String} roomName - The room name.
   * @param {JSON} options - The streams muting options.
   * @param {Boolean} [options.audioMuted=true] - The flag if all streams audio
   *   tracks should be muted or not.
   * @param {Boolean} [options.videoMuted=true] - The flag if all streams video
   *   tracks should be muted or not.
   * @param {String} [streamId] - The id of the stream to mute.
   * @return {null}
   * @example
   * Example 1: Mute both audio and video tracks in all streams
   *
   * skylink.muteStreams(roomName, {
   *    audioMuted: true,
   *    videoMuted: true
   * });
   * @example
   * Example 2: Mute only audio tracks in all streams
   *
   * skylink.muteStreams(roomName, {
   *    audioMuted: true,
   *    videoMuted: false
   * });
   * @example
   * Example 3: Mute only video tracks in all streams
   *
   * skylink.muteStreams(roomName, {
   *    audioMuted: false,
   *    videoMuted: true
   * });
   * @fires <b>On local peer:</b> {@link SkylinkEvents.event:localMediaMuted|localMediaMutedEvent}, {@link SkylinkEvents.event:streamMuted|streamMuted}, {@link SkylinkEvents.event:peerUpdated|peerUpdatedEvent} with payload parameters <code>isSelf=true</code> and <code>isAudio=true</code> if a local audio stream is muted or <code>isVideo</code> if local video stream is muted.
   * @fires <b>On remote peer:</b> {@link SkylinkEvents.event:streamMuted|streamMuted}, {@link SkylinkEvents.event:peerUpdated|peerUpdatedEvent} with with parameter payload <code>isSelf=false</code> and <code>isAudio=true</code> if a remote audio stream is muted or <code>isVideo</code> if remote video stream is muted.
   * @alias Skylink#muteStreams
   * @since 0.5.7
   */
  muteStreams(roomName, options = { audioMuted: true, videoMuted: true }, streamId) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return MediaStream.muteStreams(roomState, options, streamId);
    }

    return null;
  }

  /**
   * @description Method that starts a RTMP session. [Beta]
   * <blockquote class="info">
   *   Note that this feature requires MCU to be enabled for the App Key provided in the
   *   {@link initOptions}.
   * </blockquote>
   * @param {String} roomName - The room name.
   * @param {String} streamId - The stream id to live stream for the session.
   * @param {String} endpoint - The RTMP endpoint.
   * @return {Promise<String>} rtmpId - The RTMP session id.
   * @example
   * Example 1: Start a rtmp session
   *
   * skylink.startRTMPSession(roomName, streamId, endpoint)
   * .then(rtmpId => {
   *   // do something
   * })
   * .catch(error => {
   *   // handle error
   * });
   * @fires {@link SkylinkEvents.event:rtmpState|rtmpStateEvent} with parameter payload <code>state=START</code>.
   * @alias Skylink#startRTMPSession
   * @since 0.6.36
   */
  startRTMPSession(roomName, streamId, endpoint) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return RTMP.startSession(roomState, streamId, endpoint);
    }

    return null;
  }

  /**
   * @description Method that stops a RTMP session. [Beta]
   * <blockquote class="info">
   *   Note that this feature requires MCU to be enabled for the App Key provided in {@link initOptions}.
   * </blockquote>
   * @param {String} roomName - The room name.
   * @param {String} rtmpId - The RTMP session id.
   * @return {Promise<String>}
   * @example
   * Example 1: Stop rtmp session
   *
   * skylink.stopRTMPSession(roomName, rtmpId)
   * .then(rtmpId => {
   *   // do something
   * })
   * .catch(error => {
   *   // handle error
   * });
   * @fires {@link SkylinkEvents.event:rtmpState|rtmpStateEvent} with parameter payload <code>state=STOP</code>.
   * @alias Skylink#stopRTMPSession
   * @since 0.6.36
   */
  stopRTMPSession(roomName, rtmpId) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return RTMP.stopSession(roomState, rtmpId);
    }
    return null;
  }

  /**
     * @typedef {Object} streamSources
     * @property {Object} audio - The list of audio input (microphone) and output (speakers) sources.
     * @property {Array.<Object>} audio.input - The list of audio input (microphone) sources.
     * @property {String} audio.input.deviceId The audio input source item device id.
     * @property {String} audio.input.label The audio input source item device label name.
     * @property {String} [audio.input.groupId] The audio input source item device physical device id.
     * Note that there can be different <code>deviceId</code> due to differing sources but can share a
     * <code>groupId</code> because it's the same device.
     * @property {Array.<Object>} audio.output - The list of audio output (speakers) sources.
     * Object signature matches <code>audio.input</code> format.
     * @property {Object} video - The list of video input (camera) sources.
     * @property {Array.<Object>} video.input - The list of video input (camera) sources.
     * Object signature matches <code>audio.input</code> format.
     */
  /**
   * @description Method that returns the camera and microphone sources.
   * @return {Promise.<streamSources>} outputSources
   * @alias Skylink#getStreamSources
   */
  getStreamSources() {
    return MediaStream.getStreamSources();
  }

  /**
   * @description Method that sends a new <code>userMedia</code> stream to all connected peers in a room.
   * @param {String} roomName - The room name.
   * @param {JSON|MediaStream} options - The {@link Skylink#getUserMedia|getUserMedia} <code>options</code> parameter settings. The MediaStream to send to the remote peer.
   * - When provided as a <code>MediaStream</code> object, this configures the <code>options.audio</code> and
   *   <code>options.video</code> based on the tracks available in the <code>MediaStream</code> object.
   *   Object signature matches the <code>options</code> parameter in the
   *   <code>getUserMedia</code> method</a>.
   * @return {Promise.<MediaStream|Array<MediaStream>>}
   * @example
   * Example 1: Send new MediaStream with audio and video
   *
   * let sendStream = (roomName) => {
   * const options = { audio: true, video: true };
   *
   * // Add listener to incomingStream event
   * SkylinkEventManager.addEventListener(SkylinkConstants.EVENTS.ON_INCOMING_STREAM, (evt) => {
   *   const { detail } = evt;
   *   window.attachMediaStream(localVideoEl, detail.stream);
   * })
   *
   * skylink.sendStream(roomName, options)
   *   .catch((error) => { console.error(error) });
   * }
   *
   * Example 2: Use pre-fetched media streams
   *
   * const prefetchedStreams = null;
   * skylink.getUserMedia(null, {
   *    audio: { stereo: true },
   *    video: true,
   *    })
   *    .then((streams) => {
   *      prefetchedStream = streams
   * });
   *
   * skylink.sendStream(roomName, prefetchedStreams)
   *   .catch((error) => { console.error(error) });
   * }
   *
   * @fires {@link SkylinkEvents.event:mediaAccessSuccess} with parameter payload <code>isScreensharing=false</code> and
   * <code>isAudioFallback=false</code> if <code>userMedia</code> <code>options</code> is passed into
   * <code>sendStream</code> method.
   * @fires {@link SkylinkEvents.event:onIncomingStream} with parameter payload <code>isSelf=true</code> and
   * <code>stream</code> as <code>userMedia</code> stream.
   * @fires {@link SkylinkEvents.event:peerUpdated} with parameter payload <code>isSelf=true</code>.
   * @alias Skylink#sendStream
   * @since 0.5.6
   */
  sendStream(roomName, options) {
    const roomState = getRoomStateByName(roomName);

    return MediaStream.sendStream(roomState, options);
  }

  /**
   * @typedef {Object} screenSources - The list of screensharing media sources and screen sources.
   * @property {Array.<String>} mediaSource - The screensharing media source item.
   * @property {Array.<Object>} mediaSourceInput - The list of specific media source screen inputs.
   * @property {String} mediaSourceInput.sourceId - The screen input item id.
   * @property {Object} mediaSourceInput.label - The screen input item label name.
   * @property {Object} mediaSourceInput.mediaSource - The screen input item media source it belongs to.
   */
  /**
   * @description Method that returns the screensharing sources.
   * @return {Promise.<screenSources>}
   * @alias Skylink#getScreenSources
   * @since 2.0.0
   */
  getScreenSources() {
    return MediaStream.getScreenSources();
  }

  /**
   * @typedef {Object} streamList
   * @property {Object.<string, MediaStream>|null} userMedia - The user media streams keyed by stream id.
   * @property {MediaStream|null} screenshare - The screenshare stream.
   */
  /**
   * @description Method that returns all active user streams including screenshare stream if present.
   * @param {String} roomName - The room name.
   * @return {streamList|null}
   * @alias Skylink#getStreams
   * @since 2.0.0
   */
  getStreams(roomName) {
    const roomState = getRoomStateByName(roomName);
    if (roomState) {
      return MediaStream.getStreams(roomState);
    }

    return null;
  }

  /**
   * @description Method that generates an <a href="https://en.wikipedia.org/wiki/Universally_unique_identifier">UUID</a> (Unique ID).
   * @return {String} Returns a generated UUID (Unique ID).
   * @alias Skylink#generateUUID
   * @since 0.5.9
   */
  generateUUID() {
    return generateUUID();
  }

  /**
   * @description Method that stores a secret and secret id pair used for encrypting and decrypting messages.
   * @param {String} roomName - The room name.
   * @param {String} secret - A secret to use for encrypting and decrypting messages.
   * @param {String} secretId - The id of the secret.
   * @alias Skylink#setEncryptSecret
   * @since 2.0.0
   */
  setEncryptSecret(roomName = '', secret = '', secretId = '') {
    const roomState = getRoomStateByName(roomName);
    const encryption = new EncryptedMessaging(roomState);
    return encryption.setEncryptSecret(secret, secretId);
  }

  /**
   * @description Method that returns all the secret and secret id pairs.
   * @param {String} roomName - The room name.
   * @returns {Object|{}}
   * @alias Skylink#getEncryptSecrets
   * @since 2.0.0
   */
  getEncryptSecrets(roomName = '') {
    const roomState = getRoomStateByName(roomName);
    const encryption = new EncryptedMessaging(roomState);
    return encryption.getEncryptSecrets();
  }

  /**
   * @description Method that deletes an encrypt secret.
   * @param {String} roomName - The room name.
   * @param {String} [secretId] - The id of the secret to be deleted. If no secret id is provided, all secrets will be deleted.
   * @alias Skylink#deleteEncryptSecrets
   * @since 2.0.0
   */
  deleteEncryptSecrets(roomName = '', secretId = '') {
    const roomState = getRoomStateByName(roomName);
    const encryption = new EncryptedMessaging(roomState);
    return encryption.deleteEncryptSecrets(secretId);
  }

  /**
   * @description Method that sets the secret to be used in encrypting and decrypting messages.
   * @param {String} roomName - The room name.
   * @param {String} secretId - The id of the secret to be used for encrypting and decrypting messages.
   * @alias Skylink#setSelectedSecret
   * @since 2.0.0
   */
  setSelectedSecret(roomName = '', secretId = '') {
    const roomState = getRoomStateByName(roomName);
    const encryption = new EncryptedMessaging(roomState);
    encryption.setSelectedSecretId(secretId);
  }

  /**
   * @description Method that returns the secret used in encrypting and decrypting messages.
   * @param {String} roomName - The room name.
   * @param {String} secretId - The id of the secret.
   * @returns {String} secret - The secret used for encrypting and decrypting messages.
   * @alias Skylink#getSelectedSecret
   * @since 2.0.0
   */
  getSelectedSecret(roomName, secretId) {
    const roomState = getRoomStateByName(roomName);
    const encryption = new EncryptedMessaging(roomState);
    return encryption.getSelectedSecretId(secretId);
  }

  /**
   * @description Method that overrides the persistent message feature configured at the key level.
   * <blockquote class="info">
   *   Note that to set message persistence at the app level, the persistent message feature MUST be enabled at the key level in the Temasys
   *   Developers Console. Messages will also only be persisted if the messages are encrypted, are public messages and, are sent via the signaling
   *   server using the [{@link Skylink#sendMessage|sendMessage}] method.
   * </blockquote>
   * @param {String} roomName - The room name.
   * @param {Boolean} isPersistent - The flag if messages should be persisted.
   */
  setMessagePersistence(roomName, isPersistent) {
    const roomState = getRoomStateByName(roomName);
    const asyncMessaging = new AsyncMessaging(roomState);
    return asyncMessaging.setMessagePersistence(isPersistent);
  }

  /**
   * @description Method that retrieves the persistent message feature configured.
   * @param {String} roomName - The room name.
   * @returns {Boolean} isPersistent
   */
  getMessagePersistence(roomName) {
    const roomState = getRoomStateByName(roomName);
    const asyncMessaging = new AsyncMessaging(roomState);
    return asyncMessaging.getMessagePersistence();
  }
}

export default SkylinkPublicInterface;
