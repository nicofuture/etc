var COLOURS = ["#FEF1FF", "#FFFFFF", "#D8EBA7", "#868E80"];
var radius = 0;

var containers = document.querySelectorAll(".drawing");

containers.forEach(drawing => {
  Sketch.create({
    container: drawing,
    autoclear: false,
    retina: "auto",
    setup: function() {
      console.log("setup");
    },
    update: function() {
      radius = 2 + abs(sin(this.millis * 0.003) * 50);
    },
    // Event handlers
    keydown: function() {
      if (this.keys.C) this.clear();
    },
    // Mouse & touch events are merged, so handling touch events by default
    // and powering sketches using the touches array is recommended for easy
    // scalability. If you only need to handle the mouse / desktop browsers,
    // use the 0th touch element and you get wider device support for free.
    touchmove: function() {
      if (this.touches.length > 1) {
        for (var i = this.touches.length - 1, touch; i >= 0; i--) {
          touch = this.touches[i];
          this.lineCap = "round";
          this.lineJoin = "round";
          this.fillStyle = this.strokeStyle = COLOURS[i % COLOURS.length];
          this.lineWidth = radius;
          this.beginPath();
          this.moveTo(touch.ox, touch.oy);
          this.lineTo(touch.x, touch.y);
          this.stroke();
        }
      } else {
        var i = 0;
        var touch = this.touches[0];
        this.lineCap = "round";
        this.lineJoin = "round";
        this.fillStyle = this.strokeStyle = COLOURS[i % COLOURS.length];
        this.lineWidth = radius;
        this.beginPath();
        this.moveTo(touch.ox, touch.oy);
        this.lineTo(touch.x, touch.y);
        this.stroke();
      }
    }
  });
});
