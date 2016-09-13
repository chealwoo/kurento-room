package com.inq.saml;

import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.*;
import java.net.URLDecoder;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;

import com.inq.saml.service.MetaDataService;


public class TokenValidator {
    private static final Logger logger = Logger.getLogger(TokenValidator.class);

    private static final String SSO_STRING = "SSO:";
    private static final String SIGNATURE_ALGORITHM  = "SHA256withRSA";
    private static PublicKey pubKey = null;
    private static Signature s_signature = null;

    public TokenValidator() { }

    public static PublicKey getPubKey(){
        if(null == pubKey) {
            X509Certificate certificate = loadCertificate();
            if (certificate != null) {
                pubKey = certificate.getPublicKey();
            } else {
                logger.error("ERROR: Cannot load X509Certificate");
            }
        }
        return pubKey;
    }
    /**
     * Load the certifiate from resin/keys
     *
     * @return X508Certificate that contains the public key for signing validation
     */
    public static X509Certificate loadCertificate() {
        X509Certificate x509Certificate= null;

        try {
            String certBase64 = MetaDataService.readCertBase64();
            byte[] decodedCert = Base64.decodeBase64(certBase64.getBytes());
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            x509Certificate = (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(decodedCert));
        } catch (CertificateException | IOException e) {
            logger.error("Exception while loading X509Certificate", e);
        }

        return x509Certificate;
    }


    private static boolean initVerifySignature() {
        boolean result = true;
        if(s_signature == null) {
            result = false;
            try {
                s_signature = Signature.getInstance(SIGNATURE_ALGORITHM);
                if(null != s_signature) {
                    s_signature.initVerify(getPubKey());
                    result = true;
                }
            } catch (NoSuchAlgorithmException | InvalidKeyException e) {
                s_signature = null;
                logger.error("Exception while initVerify Signature:" + e.getMessage(), e);
            }
        }
        return result;
    }

    /**
     * validate the token,
     * The userID is also in the token
     *
     * @param userID - User Id string
     * @param token  - Token in string
     * @return - true if token is valid
     */
    public static boolean validateToken(String userID, String token) {
        boolean result = false;

        if (!initVerifySignature()) {
            logger.warn("validateToken fails because initVerifySignature() return false");
            return false;
        }

        try {
            if (token.startsWith(SSO_STRING)) {
                token = token.substring(SSO_STRING.length());
            }
            String data = URLDecoder.decode(token, "UTF-8");
            String jsonString = new String(Base64.decodeBase64(data.getBytes()));

            /*This check is performed to validate jsonString starts with JSON curly brace */
            if (jsonString != null && (jsonString.equals("") || jsonString.charAt(0) != '{')) {
                logger.warn("validateToken fails because jsonString empty or doesn't start with {");
                return false;
            }

            JSONObject jOb = new JSONObject(jsonString);

            if (userID != null && (jOb == null || !userID.equals(jOb.getString("userID")))) {
                logger.warn("validateToken fails because userID doesn't match with jOb.userID");
                return false;
            }

            String dataToBeVerified = jOb.getString("userID") + jOb.getString("idp") + jOb.getString("exp");
            byte[] buffer = dataToBeVerified.getBytes();
            TokenValidator.s_signature.update(buffer, 0, buffer.length);

            byte[] signature = Base64.decodeBase64(jOb.getString("signature").getBytes());
            result = TokenValidator.s_signature.verify(signature);

            if(logger.isDebugEnabled()) {
                logger.debug("Signature has been verified, Result:" + result);
            }
        } catch (JSONException | SignatureException | UnsupportedEncodingException e) {
            logger.error("Exception while validate token:" + e.getMessage(), e);
        }

        return result;
    }


}


