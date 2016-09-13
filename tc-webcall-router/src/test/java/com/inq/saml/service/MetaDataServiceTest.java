package com.inq.saml.service;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Created by dlee on 9/13/2016.
 */
public class MetaDataServiceTest {
    @Test
    public void readCertBase64() throws Exception {
        MetaDataService.samlCertPath = "C:\\code\\samples\\kurento\\kurento-room\\tc-webcall-router\\src\\test\\resources\\keys\\saml.crt";

        assertNotNull( MetaDataService.readCertBase64());
        System.out.print(MetaDataService.readCertBase64());
    }

}