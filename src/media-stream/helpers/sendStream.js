import {
  isAObj, isAFunction, hasVideoTrack, hasAudioTrack,
} from '../../utils/helpers';
import logger from '../../logger';
import { dispatchEvent } from '../../utils/skylinkEventManager';
import PeerData from '../../peer-data';
import { peerUpdated, onIncomingStream } from '../../skylink-events';
import PeerConnection from '../../peer-connection/index';
import MediaStream from '../index';
import MESSAGES from '../../messages';

const dispatchEvents = (roomState, stream) => {
  const { user, room } = roomState;
  const isSelf = true;
  const peerId = user.sid;
  const peerInfo = PeerData.getCurrentSessionInfo(room);

  dispatchEvent(onIncomingStream({
    room,
    stream,
    streamId: stream.id,
    isSelf,
    peerId,
    peerInfo,
    isScreensharing: false,
    isVideo: hasVideoTrack(stream),
    isAudio: hasAudioTrack(stream),
  }));

  dispatchEvent(peerUpdated({
    isSelf,
    peerId,
    peerInfo,
  }));
};

const dispatchEventsToLocalEnd = (roomState, streams) => {
  for (let i = 0; i < streams.length; i += 1) {
    if (!streams[i]) break;

    if (Array.isArray(streams[i])) {
      for (let x = 0; x < streams[i].length; x += 1) {
        if (streams[i][x]) {
          dispatchEvents(roomState, streams[i][x]);
        }
      }
    } else {
      dispatchEvents(roomState, streams[i]);
    }
  }
};

const restartFn = (roomState, streams, resolve, reject) => {
  const { AdapterJS } = window;
  const { peerConnections, hasMCU } = roomState;

  if (AdapterJS.webrtcDetectedBrowser === 'edge') {
    reject(new Error(MESSAGES.PEER_CONNECTION.refresh_no_edge_support));
  }

  try {
    dispatchEventsToLocalEnd(roomState, streams);

    if (Object.keys(peerConnections).length > 0 || hasMCU) {
      const refreshPeerConnectionPromise = PeerConnection.refreshPeerConnection(Object.keys(peerConnections), roomState, false, {});

      refreshPeerConnectionPromise.then(() => {
        resolve(streams);
      }).catch((error) => {
        logger.log.ERROR(MESSAGES.PEER_CONNECTION.ERRORS.REFRESH);
        reject(error);
      });
    } else {
      logger.log.WARN(MESSAGES.ROOM.ERRORS.NO_PEERS);
      resolve(streams);
    }
  } catch (error) {
    logger.log.ERROR(error);
  }
};

const processMediaOptions = (roomState, stream, resolve, reject) => {
  const getUserMediaPromise = MediaStream.getUserMedia(roomState, stream);

  return getUserMediaPromise.then((userMediaStreams) => {
    restartFn(roomState, userMediaStreams, resolve, reject);
  }).catch((error) => {
    reject(error);
  });
};

const processMediaStream = (roomState, stream, resolve, reject) => {
  const usePrefetchedStreamPromise = MediaStream.usePrefetchedStream(roomState.room.id, stream);

  return usePrefetchedStreamPromise.then((prefetchedStreams) => {
    restartFn(roomState, prefetchedStreams, resolve, reject);
  }).catch((error) => {
    reject(error);
  });
};

const processMediaStreamArray = (roomState, streams, resolve, reject) => {
  const usePrefetchedStreamsPromises = [];

  streams.forEach((stream) => {
    usePrefetchedStreamsPromises.push(MediaStream.usePrefetchedStream(roomState.room.id, stream));
  });

  return Promise.all(usePrefetchedStreamsPromises)
    .then((results) => {
      restartFn(roomState, results, resolve, reject);
    })
    .catch((error) => {
      reject(error);
    });
};

/**
 * Function that sends a MediaStream if provided or gets and sends an new getUserMedia stream.
 * @param {SkylinkState} roomState
 * @param {MediaStream|Object} options
 * @memberOf MediaStreamHelpers
 * @fires onIncomingStream, peerUpdated
 */
// eslint-disable-next-line consistent-return
const sendStream = (roomState, options = null) => new Promise((resolve, reject) => {
  if (!roomState) {
    return reject(new Error(MESSAGES.ROOM_STATE.NO_ROOM_NAME));
  }

  const { inRoom, streams } = roomState;
  const { AdapterJS } = window;
  const isNotObjOrNullOrPlugin = (!isAObj(options) || options === null) && !(AdapterJS && AdapterJS.WebRTCPlugin && AdapterJS.WebRTCPlugin.plugin);

  if (!inRoom) {
    logger.log.WARN(MESSAGES.ROOM.ERRORS.NOT_IN_ROOM);
    return reject(new Error(`${MESSAGES.ROOM.ERRORS.NOT_IN_ROOM}`));
  }

  if (streams.userMedia) {
    return reject(new Error(MESSAGES.MEDIA_STREAM.ERRORS.ACTIVE_STREAMS));
  }

  if (isNotObjOrNullOrPlugin) {
    return reject(new Error(`${MESSAGES.MEDIA_STREAM.ERRORS.INVALID_GUM_OPTIONS} ${options}`));
  }

  let isTypeStream = false;

  try {
    if (Array.isArray(options)) {
      let isArrayOfTypeStream = true;
      options.forEach((item) => {
        if (!isAFunction(item.getAudioTracks) || !isAFunction(item.getVideoTracks)) {
          isArrayOfTypeStream = false;
        }
      });

      if (!isArrayOfTypeStream) {
        return reject(new Error(MESSAGES.MEDIA_STREAM.ERRORS.INVALID_MEDIA_STREAM_ARRAY));
      }

      return processMediaStreamArray(roomState, options, resolve, reject);
    }

    isTypeStream = options ? (isAFunction(options.getAudioTracks) || isAFunction(options.getVideoTracks)) : false;
    if (isTypeStream) {
      return processMediaStream(roomState, options, resolve, reject);
    }

    return processMediaOptions(roomState, options, resolve, reject);
  } catch (error) {
    logger.log.ERROR(MESSAGES.MEDIA_STREAM.ERRORS.SEND_STREAM, error);
  }
});

export default sendStream;
