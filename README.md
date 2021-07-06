# Zoom By Ironex

Lightweight (8 Kb) ES5 javascript plugin without any dependencies, compatible with desktop and mobile devices.

Supports doubleclick, mousemove, mousewheel, doubletap, touchmove and pinch events.

## Demo

https://zoom.by-ironex.com

## Installation

- Option 1
  - yarn add zoom-by-ironex
  - include it in your scripts
- Option 2
  - Add `<script src="/directory/zoom-by-ironex.min.js"></script>` to the bottom of html `<body>`

Whole script is just a single function called "zoom".

## How To Use

HTML

```
<div class="zoom"> <!-- Image container, this class can be renamed in settings -->
  <img src="image-file" alt="Image">
</div>
```

CSS (Optional)

```
.zoom-transition{ // Transition class name can be renamed in settings
  transition: -moz-transform ease 200ms;
  transition: -ms-transform ease 200ms;
  transition: -o-transform ease 200ms;
  transition: -webkit-transform ease 200ms;
  transition: transform ease 200ms;
}
```

JS

```
zoom();
```

## Settings

 Example call with all possible settings

```
  zoom({
    active: "zoom-active", // Class added to container when it is zoomed
    transition: "zoom-transition", // Class added to images when they are being animated, class is removed after animation is finished
    visible: "visible" // Class added to images after they are loaded,
    zoom: "zoom" // Image container class
  }, {
    scaleDefault: 2, // Used on doubleclick, doubletap and resize
    scaleDifference: 0.5, // Used on wheel zoom
    scaleMax: 10, // Maximum zoom
    scaleMin: 1, // Minimum zoom
    scrollDisable: true, // Disable page scrolling when zooming an image
    transitionDuration: 200, // This should correspond with zoom-transition transition duration
    doubleclickDelay: 300 // // Delay between clicks - used when scripts decides if user performed doubleclick or not
  }, (function ($container, zoomed) {
    console.log(zoomed); // Callback, gets triggered whenever active class is added/removed from container, value of zoomed is true or false
  }));
```

## Supported Events

- doubleclick
- mousemove
- mousewheel
- doubletap
- touchmove
- pinch

## Additional Info

Plugin checks if image container (zoom) exists on window.load and executes for each element with image container class. If there is no element with specified class present, then it stops.
- It means, that there is no need to check if image container (zoom) exists before executing the zoom function
