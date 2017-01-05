
TC Data Event
http://confluence.touchcommerce.com/display/dev/TouchCommerce+Data+Events#TouchCommerceDataEvents-call.connected


### LTT test
ltttest: https://localhost:8443/startlttchat


### Compile and Install
```
$ cd kurento-room
$ mvn clean package -am -pl tc-webcall-router -DskipTests
#-- install
cd tc-webcall-router/target
unzip tc-webcall-router-x.x.x.zip
cd tc-webcall-router-x.x.x/bin
chmod a+x *.sh
sudo ./install.sh
#-- disable SSO security
sudo vi /etc/kurento/tc-webcall-router.conf.json
#-- restart
sudo service tc-webcall-router restart | start
```



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

### Configuarion
cd /etc/kurento
sudo vi tc-webcall-router.conf.json

### log file path
/var/log/kurento



### Start a test WebCall
https://localhost:8443

### Restful services
https://localhost:8443/getKmsReport

### TC Resource
.inq.com

webrtc-app1-test
webrtc-app2-test

webrtc-media1-test
webrtc-media2-test

http://confluence.touchcommerce.com/display/IT/WebRTC


   "repository": {
      "uri": "http://kms-repo.inq.com:7676"
   },
   

## Load Test
------------------------------------------------------------------------   
Start Chrome    
google-chrome --use-fake-device-for-media-stream --use-file-for-fake-video-capture=/home/dlee/Downloads/garden_sif.y4m --use-file-for-fake-video-capture=/home/dlee/Downloads/kennedy_moon.wav

https://10.22.111.87:8443?roomname=test1&username=uer1

"C:\Program Files (x86)\Google\Chrome\Application\Chrome.exe" --use-fake-device-for-media-stream --use-file-for-fake-video-capture="D:\temp\garden_sif.y4m" --use-file-for-fake-audio-capture="D:\temp\kennedy_moon.wav" "https://10.22.111.87:8443?roomname=test1&username=uer1"

"C:\Program Files (x86)\Google\Chrome\Application\Chrome.exe --use-fake-device-for-media-stream --use-file-for-fake-video-capture=D:\temp\garden_sif.y4m --use-file-for-fake-video-capture=D:\temp\kennedy_moon.wav  https://10.22.111.87:8443?roomname=test1&username=uer1"
"C:\Program Files (x86)\Google\Chrome\Application\Chrome.exe" --use-fake-device-for-media-stream --use-file-for-fake-video-capture="D:\temp\garden_sif.y4m" --use-file-for-fake-audio-capture="D:\temp\kennedy_moon.wav" https://10.22.111.87:8443?roomname=test1&username=uer1"
"C:\Program Files (x86)\Google\Chrome\Application\Chrome.exe" --use-fake-device-for-media-stream --use-file-for-fake-video-capture="D:\temp\garden_sif.y4m" --use-file-for-fake-audio-capture="D:\temp\kennedy_moon.wav" "https://10.22.111.87:8443?roomname=test1&username=uer1"

"C:\Program Files (x86)\Google\Chrome\Application\Chrome.exe"


# Setup Kurento Repository Server on a Ubuntu 
------------------------------------------------------------------------   
sudo add-apt-repository ppa:webupd8team/java
sudo apt-get update
sudo apt-get install oracle-java7-installer
sudo apt-get install oracle-java7-set-default

cd kurento-java

checkout -b "6.6.1" "b56713a31610c917795d350fbb311688a572f5b0"

git checkout -b "6.6.0" "e015c5214ed5a988ed7718ca4d4062e454f9cc61"

mvn clean package -DskipTests -Pdefault -am -pl kurento-repository/kurento-repository-server

cd kurento-repository/kurento-repository-server/target
unzip kurento-repository-server-x.y.z.zip

vi config/kurento-repo.conf.json

vi config/kurento-repo-log4j.properties

sudo ./bin/install.sh

$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
$ echo "deb http://repo.mongodb.org/apt/ubuntu \
   "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" \
   | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
$ sudo apt-get update
$ sudo apt-get install -y mongodb-org

/etc/mongod.conf

	68:f7:28:1b:3f:03
	
	
### git questions
------------------------------------------------------------------------  
. show current commit.
```
> git rev-parse HEAD
643293bbed133b590e274ba73f65e9cfe23d2096
> git log --pretty=format:'%h' -n 1
643293b
```
. show remote 
```
> git remote -v
origin  https://github.com/chealwoo/kurento-room.git (fetch)
origin  https://github.com/chealwoo/kurento-room.git (push)
```