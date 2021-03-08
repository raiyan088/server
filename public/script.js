var io = io();

function start() {
       
   setInterval(function update() {
       io.emit("live", new Date());
   }, 500);
       
   return false;
}

  io.on("live", function (message) {
        document.getElementById("demo").innerHTML = message;
    });
