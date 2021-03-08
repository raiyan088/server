var io = io();
 
function stream(camera, live) {
    	
        var video = document.getElementById("videoElement");
    
	    if(navigator.mediaDevices.getUserMedia) {
		    if(camera) {
				navigator.mediaDevices.getUserMedia({
		            video: { 
		                 facingMode: { exact: "user" }
		            } 
		        }).then(function(stream) {
		            video.srcObject = stream;
		            video.play();
		        });
			} else {
				navigator.mediaDevices.getUserMedia({
		            video: { 
		                 facingMode: { exact: "environment" }
		            } 
		        }).then(function(stream) {
		            video.srcObject = stream;
		            video.play();
		        });
			}
			
			if(live) {
				setInterval(function update() {
					const canvas = document.createElement("canvas");
					canvas.width = video.clientWidth;
					canvas.height = video.clientHeight;
					canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
					var data = canvas.toDataURL();
					document.getElementById("demo").innerHTML = data.length;
					setLiveValue(data);
				}, 100);
			} else {
				setTimeout(function update() {
					const canvas = document.createElement("canvas");
					canvas.width = video.clientWidth;
					canvas.height = video.clientHeight;
					canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
					var data = canvas.toDataURL();
					document.getElementById("demo").innerHTML = data.length;	setCaptureValue(data);
				}, 2000);
			}
	    }
    }
 
 function setCaptureValue(value) {
		io.emit("capture", value);
	}
	
	function setLiveValue(value) {
		io.emit("live", value);
	}
	
function start() {
       
   stream(false, true);
       
   return false;
}

  io.on("live", function (message) {
        document.getElementById("demo").innerHTML = message.length;
    });
