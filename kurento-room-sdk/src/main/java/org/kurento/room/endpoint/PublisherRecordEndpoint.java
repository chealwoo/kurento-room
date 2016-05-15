package org.kurento.room.endpoint;

import org.kurento.client.MediaPipeline;
import org.kurento.room.internal.Participant;

/**
 * Created by chealwoo on 5/13/2016.
 */
public class PublisherRecordEndpoint extends PublisherEndpoint {

    public PublisherRecordEndpoint(boolean web, Participant owner, String endpointName, MediaPipeline pipeline) {
        super(web, owner, endpointName, pipeline);
    }
}
