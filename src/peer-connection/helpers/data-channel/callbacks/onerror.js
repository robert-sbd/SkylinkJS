import logger from '../../../../logger';
import { dispatchEvent } from '../../../../utils/skylinkEventManager';
import { onDataChannelStateChanged } from '../../../../skylink-events';
import PeerConnection from '../../../../index';
import { DATA_CHANNEL_STATE } from '../../../../constants';
import Skylink from '../../../index';
import HandleDataChannelStats from '../../../../skylink-stats/handleDataChannelStats';

/**
 *
 * @param {Object} params
 * @param {Error} error
 * @fires onDataChannelStateChanged
 * @memberOf PeerConnection.PeerConnectionHelpers.CreateDataChannelCallbacks
 */
const onerror = (params, error) => {
  const {
    dataChannel,
    peerId,
    channelName,
    channelProp,
    channelType,
    roomState,
  } = params;
  const state = Skylink.getSkylinkState(roomState.room.id);
  const { room } = state;
  const handleDataChannelStats = new HandleDataChannelStats();

  logger.log.ERROR([peerId, 'RTCDataChannel', channelProp, 'Datachannel has an exception ->'], error);
  handleDataChannelStats.send(room.id, DATA_CHANNEL_STATE.ERROR, peerId, dataChannel, channelProp, error);
  dispatchEvent(onDataChannelStateChanged({
    state: DATA_CHANNEL_STATE.ERROR,
    room,
    peerId,
    channelName,
    channelType,
    bufferAmount: PeerConnection.getDataChannelBuffer(dataChannel),
    error,
  }));
};

export default onerror;
