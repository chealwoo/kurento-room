
TC Data Event
http://confluence.touchcommerce.com/display/dev/TouchCommerce+Data+Events#TouchCommerceDataEvents-call.connected


## Compile with the following command
```
$ cd kurento-room
$ mvn clean package -am -pl tc-webcall-router -DskipTests
```

### install
cd tc-webcall-router/target
unzip tc-webcall-router-x.x.x.zip


## commands I use to release.
```
ps aux | grep tc-webcall
git pull
git branch
git checkout -b TCDEV-6.6.0 origin/TCDEV-6.6.0
mvn clean package -am -pl tc-webcall-router -DskipTests
cd tc-webcall-router/target/
unzip tc-webcall-router-6.5.0.zip
cd tc-webcall-router-6.5.0/bin
chmod a+x *.sh
sudo ./install.sh
```

## Configuarion
cd /etc/kurento
sudo vi tc-webcall-router.conf.json

## log file path
/var/log/kurento



## Start WebCall
https://localhost:8443

## Restful services
https://localhost:8443/getKmsReport


## Configuration
/etc/kurento


## TC Resource
.inq.com

webrtc-app1-test
webrtc-app2-test

webrtc-media1-test
webrtc-media2-test

http://confluence.touchcommerce.com/display/IT/WebRTC


   "repository": {
      "uri": "http://kms-repo.inq.com:7676"
   },