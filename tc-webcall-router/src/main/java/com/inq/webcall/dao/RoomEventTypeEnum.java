package com.inq.webcall.dao;


import com.sun.javafx.binding.StringFormatter;

public enum RoomEventTypeEnum {
    CREATED("CREATED"),
    CLOSED("CLOSED"),
    PARTY_JOIN("PARTY_JOIN"),
    PARTY_LEAVE("PARTY_LEAVE"),
    PUBLISHED("PUBLISHED"),
    SUBSCRIBED("SUBSCRIBED"),
    ERROR("ERROR");

    private String name;

    RoomEventTypeEnum(String name) {
        this.name = name;
    }

    public String toString(){
        return this.name;
    }
}
