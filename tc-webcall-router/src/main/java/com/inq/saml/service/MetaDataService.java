package com.inq.saml.service;

import org.apache.log4j.Logger;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

/**
 Utility class to read certificate from resin_home keys directory
 */
public class MetaDataService {
    private static final Logger logger = Logger.getLogger(MetaDataService.class);

    private static String base64Text = null;
    private static final String descriptorFirst = "-----BEGIN CERTIFICATE-----";
    private static final String descriptorLast = "-----END CERTIFICATE-----";

    public static String samlCertPath = File.separator + "keys" + File.separator + "saml.crt";

    public static String readCertBase64() throws IOException {

        /* initiate base64Text */
        if (null == base64Text) {
            File samlCertFile = new File(samlCertPath);

            String lineIn;

            try(BufferedReader br = new BufferedReader(new FileReader(samlCertFile))) {
                StringBuilder buff = new StringBuilder();
                lineIn = br.readLine();
                if (null != lineIn && lineIn.contentEquals(descriptorFirst)) {
                    while ((lineIn = br.readLine()) != null && !(lineIn.contentEquals(descriptorLast))) {
                        buff.append(lineIn);
                    }
                }
                base64Text = buff.toString();
            }
        }
        return base64Text;
    }
}

