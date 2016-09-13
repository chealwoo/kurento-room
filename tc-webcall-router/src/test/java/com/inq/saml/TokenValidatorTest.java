package com.inq.saml;

import org.junit.Test;

import static org.junit.Assert.*;


public class TokenValidatorTest {
    @Test
    public void getPubKey() throws Exception {
        assertNotNull( TokenValidator.getPubKey() );
    }

    @Test
    public void loadCertificate() throws Exception {
        assertNotNull( TokenValidator.loadCertificate() );
    }

    @Test
    public void validateToken() throws Exception {
        assertTrue( TokenValidator.validateToken("fpinn@att.com", "eyJpZHAiOiIxIiwic2lnbmF0dXJlIjoickNxdHozK0xQbktFdFpScThraXVSR1VZLzhSOExjaXdYUm5paXdac1d5YzdwMEtGWW1VVnl3Y0ZtK1pLL2lLeHE5aytuZlI1V0pzRzM3b1poRzJFc3JtaDdFUS9tMWE2ZTBGTVEvbWErV3hGejYrR09xR2o3d2Z5c3NuNTdXYnFuaXVlZUdxdzBGam9SbWVzcUZycXhXT0RFangzMG4wTkptYXN4OTJpcTFUeDBybDJXMDlYYkRIRFVxVDNwR0RwVTJjSG1zYWVFMnRyRzNnRDhSQU5jNmxTMjNzVHdiWnExQnNTMWNWUlk0ODM2akdueStId05GdU0wRmdvQ3ZLWnRsMnZWYVBZOEVCVDdUbUtHbHpya1V1dFJjM09wWkN0aTBnbThsdFpCQUFhUXB4eTYrdjFpYUtaRnlHWWhqVXpNcUowbFJORC9JNjdrbnd1ZFYwOWpRaDdKdm1OTU9sM2dmRmc3Uk85cFFjdHFsQnZTY3VTaHFURVk1aXFxc0lsZ0ZuZWxmb1RWdlFWbFd3ejdiM3J6THUzeUxBZDRiWGVxa25VY1BlRTB5NHVqelpuM2U3Y2YzcEJoWnFCbTZtQzlURmt4bnBheVh6N3lIZ1duZkV5S0dRajFsVytqcmhZSkVmUHdBdUZ2cVRHMnJqSEFJNUNFVGt0Y25tVE90WTR4VjhCbG5HdDQ1MExDbTR1VjRoZE96TkNNVGFoZ1l0R2podldtVE40L2FFQVZEOXNaQVNia05rZUs1QzZyQkZpK0d6L0piL2x0QnJtOXViYzkwMGdwMHlYaGpRUnBQUENKbFR5VU1UY0k1aDFpWDdlcmM1OTNlV01WWklKNjlaU1BleFE4eTh1blMzbk43QjRQaEpoZ09BZnhnODJFMHRkdGFQNDFzcjVTaVE9IiwiZXhwIjoiMjAxNi0wOS0xM1QxMTo0NjoxOS4yMDMtMDg6MDAiLCJ1c2VySUQiOiJmcGlubkBhdHQuY29tIn0=") );
    }

}