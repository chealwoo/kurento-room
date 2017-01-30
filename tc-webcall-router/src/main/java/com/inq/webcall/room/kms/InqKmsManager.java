package com.inq.webcall.room.kms;


import org.kurento.client.KurentoClient;
import org.kurento.room.api.KurentoClientProvider;
import org.kurento.room.api.KurentoClientSessionInfo;
import org.kurento.room.exception.RoomException;
import org.kurento.room.exception.RoomException.Code;
import org.kurento.room.internal.DefaultKurentoClientSessionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

/**
 * This class is based on org.kurento.room.kms.KmsManager
 * In addition to its original Clone, this function provides removing KMS
 */
public abstract class InqKmsManager implements KurentoClientProvider {

    public static class KmsLoad implements Comparable<KmsLoad> {

        private InqKms kms;
        private double load;

        public KmsLoad(InqKms kms, double load) {
            this.kms = kms;
            this.load = load;
        }

        public InqKms getKms() {
            return kms;
        }

        public double getLoad() {
            return load;
        }

        @Override
        public int compareTo(KmsLoad o) {
            return Double.compare(this.load, o.load);
        }
    }

    private final Logger log = LoggerFactory.getLogger(InqKmsManager.class);

    private List<InqKms> kmss = new ArrayList<InqKms>();
    private Iterator<InqKms> usageIterator = null;

    @Override
    public KurentoClient getKurentoClient(KurentoClientSessionInfo sessionInfo) throws RoomException {
        if (!(sessionInfo instanceof DefaultKurentoClientSessionInfo)) {
            throw new RoomException(Code.GENERIC_ERROR_CODE, "Unkown session info bean type (expected "
                    + DefaultKurentoClientSessionInfo.class.getName() + ")");
        }
        return getKms((DefaultKurentoClientSessionInfo) sessionInfo).getKurentoClient();
    }

    /**
     * Returns a {@link InqKms} using a round-robin strategy.
     *
     * @param sessionInfo
     *          session's id
     */
    public synchronized InqKms getKms(DefaultKurentoClientSessionInfo sessionInfo) {
        if (usageIterator == null || !usageIterator.hasNext()) {
            usageIterator = kmss.iterator();
        }
        return usageIterator.next();
    }

    public synchronized void addKms(InqKms kms) {
        this.kmss.add(kms);
    }

    /**
     * *Custom Added
     * Remove Kms from its list.
     *
     * To remove a kms from it list, kms is disconnected already.
     *
     * @param kms
     */
    public synchronized boolean removeKms(InqKms kms) {
        if(kms.getLoadManager().isBlocked() && kms.getRealLoad() == 0.0) {
            this.kmss.remove(kms);
            return true;
        }
        return false;
    }

    public boolean removeKms(String uri, boolean force) {
        InqKms kms = getKms(uri);
        if(kms != null && ((kms.getLoadManager().isBlocked() && kms.getRealLoad() == 0.0 ) || force)) {
            return this.kmss.remove(kms);
        }
        return false;
    }

    /**
     * * Custom Added
     *
     * @param uri
     * @return
     */
    public InqKms getKms(String uri){
        for(InqKms kms: this.kmss){
            if (kms.getUri().equals(uri)) {
                return kms;
            }
        }
        return null;
    }

    public synchronized InqKms getLessLoadedKms() {
        return Collections.min(getKmsLoads()).kms;
    }

    public synchronized InqKms getNextLessLoadedKms() {
        List<KmsLoad> sortedLoads = getKmssSortedByLoad();
        if (sortedLoads.size() > 1) {
            return sortedLoads.get(1).kms;
        } else {
            return sortedLoads.get(0).kms;
        }
    }

    public synchronized List<KmsLoad> getKmssSortedByLoad() {
        List<KmsLoad> kmsLoads = getKmsLoads();
        Collections.sort(kmsLoads);
        return kmsLoads;
    }

    public List<KmsLoad> getKmsLoads() {
        ArrayList<KmsLoad> kmsLoads = new ArrayList<>();
        for (InqKms kms : kmss) {
            double load = kms.getLoad();
            kmsLoads.add(new KmsLoad(kms, load));
            log.trace("Calc load {} for kms: {}", load, kms.getUri());
        }
        return kmsLoads;
    }

    @Override
    public boolean destroyWhenUnused() {
        return false;
    }
}