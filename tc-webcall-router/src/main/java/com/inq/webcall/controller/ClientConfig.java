package com.inq.webcall.controller;

class ClientConfig {
    private boolean loopbackRemote;
    private boolean loopbackAndLocal;

    public boolean isLoopbackRemote() {
        return loopbackRemote;
    }

    public void setLoopbackRemote(boolean loopbackRemote) {
        this.loopbackRemote = loopbackRemote;
    }

    public boolean isLoopbackAndLocal() {
        return loopbackAndLocal;
    }

    public void setLoopbackAndLocal(boolean loopbackAndLocal) {
        this.loopbackAndLocal = loopbackAndLocal;
    }

    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append("Loopback [remote=").append(loopbackRemote).append(", andLocal=")
                .append(loopbackAndLocal).append("]");
        return builder.toString();
    }
}
