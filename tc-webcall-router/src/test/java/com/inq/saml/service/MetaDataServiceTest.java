package com.inq.saml.service;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Created by dlee on 9/13/2016.
 */
public class MetaDataServiceTest {
    @Test
    public void readCertBase64() throws Exception {
        assertNotNull( MetaDataService.readCertBase64());
        System.out.print(MetaDataService.readCertBase64());
    }
}