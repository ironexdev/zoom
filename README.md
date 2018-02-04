# Image Zoom

- allows user to zoom an image

## SUPPORTED EVENTS

- doubleclick
- doubletap
- mousewheel
- touchmove/pinch

## HTML

    <div class="zoom">
        <img src="" alt="">
    </div>

## CSS

    #container .zoom  
    {  
        height: 100%; 
        overflow: hidden;
        width: 100%;  
    }

    #container .zoom img
    {
        bottom: 0;
        display: block;
        left: 0;
        margin: auto;
        max-height: 100%;
        max-width: 100%;
        position: absolute;
        right: 0;
        top: 0;
        -moz-transform-style: preserve-3d;
        -ms-transform-style: preserve-3d;
        -o-transform-style: preserve-3d;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;
    }

## JS

    zoom(classNames = {}, settings = {});

    classNames =
    {
        active : "active",
        visible : "visible",
        zoom : "zoom"
    };

    settings = 
    {
        scaleDefault : 2,
        scaleDifference : 0.5, // used for wheel zoom
        scaleMax : 10,
        scaleMin : 1
    };
