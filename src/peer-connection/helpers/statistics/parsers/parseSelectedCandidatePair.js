/* eslint-disable prefer-destructuring */
import parsers from './index';

// eslint-disable-next-line no-restricted-properties,no-unused-vars
const computePriortyFn = (controller, controlled) => (Math.pow(2, 32) * Math.min(controller, controlled)) + (2 * Math.max(controller, controlled)) + (controller > controlled ? 1 : 0);

const formatCanTypeFn = (type) => {
  if (type === 'relay') {
    return 'relayed';
  } if (type === 'host' || type.indexOf('host') > -1) {
    return 'local';
  } if (type === 'srflx') {
    return 'serverreflexive';
  }
  return type;
};

/**
 * Function that parses the raw stats from the RTCIceCandidatePairStats dictionary.
 * @param {SkylinkState} roomState - The room state.
 * @param {Object} output - Stats output object that stores the parsed stats values.
 * @param {String} prop - Stats dictionary identifier
 * @param {RTCPeerConnection} peerConnection - The peer connection.
 * @param {String} peerId - The peer Id.
 * @param {boolean} isAutoBwStats - The flag if auto bandwidth adjustment is true.
 * @memberOf PeerConnectionStatisticsParsers
 */
const parseSelectedCandidatePair = (roomState, output, prop, peerConnection, peerId, isAutoBwStats) => {
  const { peerBandwidth, peerStats } = roomState;
  const { raw, selectedCandidatePair } = output;

  const keys = Object.keys(output.raw);
  let transportStats = null;
  let selectedLocalCandidateId = null;
  let selectedRemoteCandidateId = null;

  if (!(raw[prop].type === 'remote-candidate' || raw[prop].type === 'local-candidate')) {
    return;
  }

  // Obtain selectedCandidatePairId from RTCTransportStats
  for (let i = 0; i < keys.length; i += 1) {
    if (raw[keys[i]].type === 'transport') {
      transportStats = raw[keys[i]];
    }
  }

  if (transportStats) {
    for (let i = 0; i < keys.length; i += 1) {
      if (raw[keys[i]].type === 'candidate-pair') {
        const candidatePairStats = raw[keys[i]];
        if (transportStats.selectedCandidatePairId === candidatePairStats.id) {
          selectedLocalCandidateId = candidatePairStats.localCandidateId;
          selectedRemoteCandidateId = candidatePairStats.remoteCandidateId;

          selectedCandidatePair.id = candidatePairStats.id;
          selectedCandidatePair.writable = candidatePairStats.writable;
          selectedCandidatePair.priority = candidatePairStats.priority;
          selectedCandidatePair.nominated = candidatePairStats.nominated;

          const prevStats = isAutoBwStats ? peerBandwidth[peerId][prop] : peerStats[peerId][prop];
          // FF has not implemented the following stats
          const totalRoundTripTime = parseInt(raw[keys[i]].totalRoundTripTime || '0', 10);
          selectedCandidatePair.totalRoundTripTime = totalRoundTripTime;
          selectedCandidatePair.totalRoundTripTime = parsers.tabulateStats(prevStats, raw[keys[i]], 'totalRoundTripTime');

          const consentRequestsSent = parseInt(raw[keys[i]].consentRequestsSent || '0', 10);
          selectedCandidatePair.consentRequests.totalSent = consentRequestsSent;
          selectedCandidatePair.consentRequests.sent = parsers.tabulateStats(prevStats, raw[keys[i]], 'consentRequestsSent');

          const requestsReceived = parseInt(raw[keys[i]].requestsReceived || '0', 10);
          selectedCandidatePair.requests.totalReceived = requestsReceived;
          selectedCandidatePair.requests.received = parsers.tabulateStats(prevStats, raw[keys[i]], 'requestsReceived');

          const requestsSent = parseInt(raw[keys[i]].requestsSent || '0', 10);
          selectedCandidatePair.requests.totalSent = requestsSent;
          selectedCandidatePair.requests.sent = parsers.tabulateStats(prevStats, raw[keys[i]], 'requestsSent');

          const responsesSent = parseInt(raw[keys[i]].responsesSent || '0', 10);
          selectedCandidatePair.responses.totalSent = responsesSent;
          selectedCandidatePair.responses.sent = parsers.tabulateStats(prevStats, raw[keys[i]], 'responsesSent');

          const responsesReceived = parseInt(raw[keys[i]].responsesReceived || '0', 10);
          selectedCandidatePair.responses.totalReceived = responsesReceived;
          selectedCandidatePair.responses.received = parsers.tabulateStats(prevStats, raw[keys[i]], 'responsesReceived');
        }
      }
    }
  }

  if (selectedLocalCandidateId && selectedRemoteCandidateId) {
    if (raw[prop].type === 'remote-candidate') {
      const remoteCandidateStats = raw[prop];
      if (remoteCandidateStats.id === selectedRemoteCandidateId) {
        selectedCandidatePair.remote.ipAddress = remoteCandidateStats.ip;
        selectedCandidatePair.remote.portNumber = remoteCandidateStats.port;
        selectedCandidatePair.remote.transport = remoteCandidateStats.protocol;
        selectedCandidatePair.remote.priority = remoteCandidateStats.priority;
        selectedCandidatePair.remote.candidateType = formatCanTypeFn(remoteCandidateStats.candidateType);
      }
    }

    if (raw[prop].type === 'local-candidate') {
      const localCandidateStats = raw[prop];
      if (localCandidateStats.id === selectedLocalCandidateId) {
        selectedCandidatePair.local.ipAddress = localCandidateStats.ip;
        selectedCandidatePair.local.portNumber = localCandidateStats.port;
        selectedCandidatePair.local.transport = localCandidateStats.protocol;
        selectedCandidatePair.local.priority = localCandidateStats.priority;
        selectedCandidatePair.local.candidateType = formatCanTypeFn(localCandidateStats.candidateType);
      }
    }
  }

  /**

   TODO: Old stats implementation - remove once tested
  if (raw[prop].type === 'candidate-pair') {
    // Use the nominated pair, else use the one that has succeeded but not yet nominated.
    // This is to handle the case where none of the ICE candidates appear nominated.
    if (raw[prop].state !== 'succeeded' || !raw[prop].nominated || (selectedCandidate.nominated ? true
      : (raw[prop].priority < (selectedCandidate.priority || 0)))) {
      return;
    }

    const prevStats = isAutoBwStats ? peerBandwidth[peerId][prop] : peerStats[peerId][prop];

    // Map the selected ICE candidate pair based on computed priority
    const sending = (peerConnection.localDescription && peerConnection.localDescription.sdp && peerConnection.localDescription.sdp.match(/a=candidate:.*\r\n/gi)) || [];
    const receiving = (peerConnection.remoteDescription && peerConnection.remoteDescription.sdp && peerConnection.remoteDescription.sdp.match(/a=candidate:.*\r\n/gi)) || [];

    for (let s = 0; s < sending.length; s += 1) {
      const sendCanParts = sending[s].split(' ');

      for (let r = 0; r < receiving.length; r += 1) {
        const recvCanParts = receiving[r].split(' ');
        let priority = selectedCandidate.priority;

        if (raw[prop].writable) {
          // Compute the priority since we are the controller
          priority = computePriortyFn(parseInt(sendCanParts[3], 10), parseInt(recvCanParts[3], 10));
        } else {
          // Compute the priority since we are the controlled
          priority = computePriortyFn(parseInt(recvCanParts[3], 10), parseInt(sendCanParts[3], 10));
        }

        if (priority === raw[prop].priority) {
          selectedCandidate.local.ipAddress = sendCanParts[4];
          selectedCandidate.local.portNumber = parseInt(sendCanParts[5], 10);
          selectedCandidate.local.transport = sendCanParts[2];
          selectedCandidate.local.priority = parseInt(sendCanParts[3], 10);
          selectedCandidate.local.candidateType = formatCanTypeFn(sendCanParts[7]);
          selectedCandidate.local.networkType = raw[raw[prop].localCandidateId].networkType;

          selectedCandidate.remote.ipAddress = recvCanParts[4];
          selectedCandidate.remote.portNumber = parseInt(recvCanParts[5], 10);
          selectedCandidate.remote.transport = recvCanParts[2];
          selectedCandidate.remote.priority = parseInt(recvCanParts[3], 10);
          selectedCandidate.remote.candidateType = formatCanTypeFn(recvCanParts[7]);
          break;
        }

        if (isEmptyObj(selectedCandidate.local) && isEmptyObj(selectedCandidate.remote)) {
          break;
        }
      }
    }

    selectedCandidate.writable = raw[prop].writable;
    selectedCandidate.priority = raw[prop].priority;
    selectedCandidate.nominated = raw[prop].nominated;

    // FF has not implemented the following stats
    const totalRoundTripTime = parseInt(raw[prop].totalRoundTripTime || '0', 10);
    selectedCandidate.totalRoundTripTime = totalRoundTripTime;
    selectedCandidate.totalRoundTripTime = parsers.tabulateStats(prevStats, raw[prop], 'totalRoundTripTime');

    const consentRequestsSent = parseInt(raw[prop].consentRequestsSent || '0', 10);
    selectedCandidate.consentRequests.totalSent = consentRequestsSent;
    selectedCandidate.consentRequests.sent = parsers.tabulateStats(prevStats, raw[prop], 'consentRequestsSent');

    const requestsReceived = parseInt(raw[prop].requestsReceived || '0', 10);
    selectedCandidate.requests.totalReceived = requestsReceived;
    selectedCandidate.requests.received = parsers.tabulateStats(prevStats, raw[prop], 'requestsReceived');

    const requestsSent = parseInt(raw[prop].requestsSent || '0', 10);
    selectedCandidate.requests.totalSent = requestsSent;
    selectedCandidate.requests.sent = parsers.tabulateStats(prevStats, raw[prop], 'requestsSent');

    const responsesSent = parseInt(raw[prop].responsesSent || '0', 10);
    selectedCandidate.responses.totalSent = responsesSent;
    selectedCandidate.responses.sent = parsers.tabulateStats(prevStats, raw[prop], 'responsesSent');

    const responsesReceived = parseInt(raw[prop].responsesReceived || '0', 10);
    selectedCandidate.responses.totalReceived = responsesReceived;
    selectedCandidate.responses.received = parsers.tabulateStats(prevStats, raw[prop], 'responsesReceived');
  }

  * */
  // TODO:
  //  // FF has not fully implemented candidate-pair
  //  // test for Plugin
  // else if (raw[prop].type === 'googCandidatePair') {
  //   const prevStats = isAutoBwStats ? self._peerBandwidth[peerId][prop] : self._peerStats[peerId][prop];
  //
  //   selectedCandidate.writable = raw[prop].googWritable === 'true';
  //   selectedCandidate.readable = raw[prop].googReadable === 'true';
  //
  //   var rtt = parseInt(raw[prop].googRtt || '0', 10);
  //   selectedCandidate.totalRtt = rtt;
  //   selectedCandidate.rtt = self._parseConnectionStats(prevStats, raw, 'rtt');
  //
  //   if (raw[prop].consentResponsesReceived) {
  //     var consentResponsesReceived = parseInt(raw[prop].consentResponsesReceived || '0', 10);
  //     selectedCandidate.consentResponses.totalReceived = consentResponsesReceived;
  //     selectedCandidate.consentResponses.received = self._parseConnectionStats(prevStats, raw, 'consentResponsesReceived');
  //   }
  //
  //   if (raw[prop].consentResponsesSent) {
  //     var consentResponsesSent = parseInt(raw[prop].consentResponsesSent || '0', 10);
  //     selectedCandidate.consentResponses.totalSent = consentResponsesSent;
  //     selectedCandidate.consentResponses.sent = self._parseConnectionStats(prevStats, raw, 'consentResponsesSent');
  //   }
  //
  //   if (raw[prop].responsesReceived) {
  //     var responsesReceived = parseInt(raw[prop].responsesReceived || '0', 10);
  //     selectedCandidate.responses.totalReceived = responsesReceived;
  //     selectedCandidate.responses.received = self._parseConnectionStats(prevStats, raw, 'responsesReceived');
  //   }
  //
  //   if (raw[prop].responsesSent) {
  //     var responsesSent = parseInt(raw[prop].responsesSent || '0', 10);
  //     selectedCandidate.responses.totalSent = responsesSent;
  //     selectedCandidate.responses.sent = self._parseConnectionStats(prevStats, raw, 'responsesSent');
  //   }
  //
  //   var localCanItem = raw[raw[prop].localCandidateId || ''] || {};
  //   selectedCandidate.local.ipAddress = localCanItem.ipAddress;
  //   selectedCandidate.local.portNumber = parseInt(localCanItem.portNumber, 10);
  //   selectedCandidate.local.priority = parseInt(localCanItem.priority, 10);
  //   selectedCandidate.local.networkType = localCanItem.networkType;
  //   selectedCandidate.local.transport = localCanItem.transport;
  //   selectedCandidate.local.candidateType = localCanItem.candidateType;
  //
  //   var remoteCanItem = raw[raw[prop].remoteCandidateId || ''] || {};
  //   selectedCandidate.remote.ipAddress = remoteCanItem.ipAddress;
  //   selectedCandidate.remote.portNumber = parseInt(remoteCanItem.portNumber, 10);
  //   selectedCandidate.remote.priority = parseInt(remoteCanItem.priority, 10);
  //   selectedCandidate.remote.transport = remoteCanItem.transport;
  //   selectedCandidate.remote.candidateType = remoteCanItem.candidateType;
  // }
};

export default parseSelectedCandidatePair;
