"use strict";

/* Example call
  zoom({
    active: "zoom-active",
    transition: "zoom-transition",
    visible: "visible",
    zoom: "zoom" // Image container class
  }, {
    scaleDefault: 2, // Used on doubleclick, doubletap and resize
    scaleDifference: 0.5, // Used on wheel zoom
    scaleMax: 10, // Maximum zoom
    scaleMin: 1, // Minimum zoom
    scrollDisable: true,
    transitionDuration: 200, // This should correspond with zoom-transition transition duration
    doubleclickDelay: 300 // Delay between clicks - used when scripts decides if user performed doubleclick or not
  }, (function ($container, zoomed) {
    console.log(zoomed);
  }));
*/

function zoom(classNames, settings, callback) {
  /* Settings */
  classNames = (typeof (classNames) !== "undefined" && Object.keys(classNames).length ? classNames : {});
  settings = (typeof (settings) !== "undefined" && Object.keys(settings).length ? settings : {});
  var SCALE_DEFAULT = settings["scaleDefault"] || 2; // Used on doubleclick, doubletap and resize
  var SCALE_DIFFERENCE = settings["scaleDifference"] || 0.5; // Used on wheel zoom
  var SCALE_MAX = settings["scaleMax"] || 10;
  var SCALE_MIN = settings["scaleMin"] || 1;
  var SCROLL_DISABLE = settings["scrollDisable"] || true;
  var TRANSITION_DURATION = settings["transitionDuration"] || 200; // This should correspond with zoom-transition transition duration
  var DOUBLECLICK_DELAY = settings["doubleclickDelay"] || 300;

  /* Safari on iOS doesn't properly scale images using 3d transforms */
  var SUPPORT_3D_TRANSFORM = !iOSSafari();

  if (SCROLL_DISABLE) {
    /* Enable/disable scroll values */
    var supportsPassive = false;
    try {
      window.addEventListener("test", null, Object.defineProperty({}, "passive", {
        get: function () {
          supportsPassive = true;
        }
      }));
    } catch (e) {
    }
    var wheelOpt = supportsPassive ? {passive: false} : false;
    var wheelEvent = "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";
  }

  /* Selectors */
  var _active = classNames["active"] || "zoom-active";
  var _dataScale = "data-scale";
  var _dataTranslateX = "data-translate-x";
  var _dataTranslateY = "data-translate-y";
  var _transition = classNames["transition"] || "zoom-transition";
  var _visible = classNames["visible"] || "zoom-visible";
  var _zoom = classNames["zoom"] || "zoom";
  var $container;
  var $element;
  var $zoom = document.getElementsByClassName(_zoom);

  /* Helpers */
  var capture = false;
  var doubleClickMonitor = [null];
  var containerHeight;
  var containerWidth;
  var containerOffsetX;
  var containerOffsetY;
  var initialScale;
  var elementHeight;
  var elementWidth;
  var initialOffsetX;
  var initialOffsetY;
  var initialPinchDistance;
  var initialPointerOffsetX;
  var initialPointerOffsetX2;
  var initialPointerOffsetY;
  var initialPointerOffsetY2;
  var limitOffsetX;
  var limitOffsetY;
  var mousemoveCount = 0;
  var offset;
  var pinchOffsetX;
  var pinchOffsetY;
  var pointerOffsetX;
  var pointerOffsetX2;
  var pointerOffsetY;
  var pointerOffsetY2;
  var scaleDirection;
  var scaleDifference;
  var targetOffsetX;
  var targetOffsetY;
  var targetPinchDistance;
  var targetScale;
  var touchable = false;
  var touchCount;
  var touchmoveCount = 0;
  var doubleTapMonitor = [null];

  for (var i = 0; i < $zoom.length; i++) {
    /* Initialize selectors */
    $container = $zoom[i];
    $element = $container.children[0];

    /* Set attributes */
    $element.setAttribute(_dataScale, 1);
    $element.setAttribute(_dataTranslateX, 0);
    $element.setAttribute(_dataTranslateY, 0);
  }

  window.addEventListener("load", function () {
    /* Wait for images to be loaded */
    for (var i = 0; i < $zoom.length; i++) {
      /* Initialize selectors */
      $container = $zoom[i];
      $element = $container.children[0];

      addClass($element, _visible);
    }

    window.addEventListener("resize", function () {
      for (var i = 0; i < $zoom.length; i++) {
        /* Initialize selectors */
        $container = $zoom[i];
        $element = $container.children[0];

        if (hasClass($container, _active) === false) {
          continue;
        }

        /* Initialize helpers */
        containerHeight = $container.clientHeight;
        containerWidth = $container.clientWidth;
        elementHeight = $element.clientHeight;
        elementWidth = $element.clientWidth;
        initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
        initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
        targetScale = SCALE_DEFAULT;
        limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
        limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);
        targetOffsetX = (elementWidth * targetScale) > containerWidth ? minMax(initialOffsetX, limitOffsetX * (-1), limitOffsetX) : 0;
        targetOffsetY = (elementHeight * targetScale) > containerHeight ? minMax(initialOffsetY, limitOffsetY * (-1), limitOffsetY) : 0;

        if (targetScale === 1) {
          zoomInactive($container);
        }

        /* Set attributes */
        $element.setAttribute(_dataScale, targetScale);
        $element.setAttribute(_dataTranslateX, targetOffsetX);
        $element.setAttribute(_dataTranslateY, targetOffsetY);

        moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
      }
    });
  });

  massAddEventListener($zoom, "mousedown", mouseDown);

  massAddEventListener($zoom, "mouseenter", mouseEnter);

  massAddEventListener($zoom, "mouseleave", mouseLeave);

  document.addEventListener("mousemove", mouseMove);

  document.addEventListener("mouseup", mouseUp);

  document.addEventListener("touchstart", function () {
    touchable = true;
  });

  massAddEventListener($zoom, "touchstart", touchStart);

  document.addEventListener("touchmove", touchMove, {passive: false}); // Google Chrome - [Intervention] Unable to preventDefault inside passive event listener due to target being treated as passive.

  document.addEventListener("touchend", touchEnd);

  massAddEventListener($zoom, "wheel", wheel);

  function mouseEnter() {
    disableScroll();
  }

  function mouseLeave() {
    enableScroll();
  }

  function mouseDown(e) {
    preventDefault();

    if (touchable === true || e.which !== 1) {
      return false;
    }

    /* Initialize selectors */
    $container = this;
    $element = this.children[0];

    /* Initialize helpers */
    initialPointerOffsetX = e.clientX;
    initialPointerOffsetY = e.clientY;

    /* Doubleclick */
    if (doubleClickMonitor[0] === null) {
      doubleClickMonitor[0] = e.target;
      doubleClickMonitor[1] = initialPointerOffsetX;
      doubleClickMonitor[2] = initialPointerOffsetY;

      setTimeout(function () {
        doubleClickMonitor = [null];
      }, DOUBLECLICK_DELAY);
    } else if (doubleClickMonitor[0] === e.target && mousemoveCount <= 5 && isWithinRange(initialPointerOffsetX, doubleClickMonitor[1] - 10, doubleClickMonitor[1] + 10) === true && isWithinRange(initialPointerOffsetY, doubleClickMonitor[2] - 10, doubleClickMonitor[2] + 10) === true) {
      addClass($element, _transition);

      if (hasClass($container, _active) === true) {
        /* Set attributes */
        $element.setAttribute(_dataScale, 1);
        $element.setAttribute(_dataTranslateX, 0);
        $element.setAttribute(_dataTranslateY, 0);

        zoomInactive($container);

        moveScaleElement($element, 0, 0, 1);
      } else {
        pointerOffsetX = e.clientX;
        pointerOffsetY = e.clientY;
        targetScale = SCALE_DEFAULT;
        scaleDirection = 1;
        scaleDifference = (SCALE_DEFAULT - 1) * scaleDirection;

        /* Set offset limits */
        limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
        limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);

        if (targetScale <= 1) {
          targetOffsetX = 0;
          targetOffsetY = 0;
        } else {
          /* Set target offsets */
          targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(initialOffsetX - ((((((pointerOffsetX - containerOffsetX) - (containerWidth / 2)) - initialOffsetX) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
          targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(initialOffsetY - ((((((pointerOffsetY - containerOffsetY) - (containerHeight / 2)) - initialOffsetY) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
        }

        zoomActive($container);

        /* Set attributes */
        $element.setAttribute(_dataScale, targetScale);
        $element.setAttribute(_dataTranslateX, targetOffsetX);
        $element.setAttribute(_dataTranslateY, targetOffsetY);

        moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", SCALE_DEFAULT);
      }

      setTimeout(function () {
        removeClass($element, _transition);
      }, TRANSITION_DURATION);

      doubleClickMonitor = [null];
      return false;
    }

    /* Initialize helpers */
    offset = $container.getBoundingClientRect();
    containerOffsetX = offset.left;
    containerOffsetY = offset.top;
    containerHeight = $container.clientHeight;
    containerWidth = $container.clientWidth
    elementHeight = $element.clientHeight;
    elementWidth = $element.clientWidth;
    initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
    initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
    initialScale = minMax(parseFloat($element.getAttribute(_dataScale)), SCALE_MIN, SCALE_MAX);

    mousemoveCount = 0;

    /* Set capture */
    capture = true;
  }

  function mouseMove(e) {
    if (touchable === true || capture === false) {
      return false;
    }

    /* Initialize helpers */
    pointerOffsetX = e.clientX;
    pointerOffsetY = e.clientY;
    targetScale = initialScale;
    limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
    limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);
    targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(pointerOffsetX - (initialPointerOffsetX - initialOffsetX), limitOffsetX * (-1), limitOffsetX);
    targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(pointerOffsetY - (initialPointerOffsetY - initialOffsetY), limitOffsetY * (-1), limitOffsetY);
    mousemoveCount++;

    if (Math.abs(targetOffsetX) === Math.abs(limitOffsetX)) {
      initialOffsetX = targetOffsetX;
      initialPointerOffsetX = pointerOffsetX;
    }

    if (Math.abs(targetOffsetY) === Math.abs(limitOffsetY)) {
      initialOffsetY = targetOffsetY;
      initialPointerOffsetY = pointerOffsetY;
    }

    /* Set attributes */
    $element.setAttribute(_dataScale, targetScale);
    $element.setAttribute(_dataTranslateX, targetOffsetX);
    $element.setAttribute(_dataTranslateY, targetOffsetY);

    moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
  }

  function mouseUp() {
    if (touchable === true || capture === false) {
      return false;
    }

    /* Unset capture */
    capture = false;
  }

  function touchStart(e) {
    preventDefault();

    if (e.touches.length > 2) {
      return false;
    }

    /* Initialize selectors */
    $container = this;
    $element = this.children[0];

    /* Initialize helpers */
    offset = $container.getBoundingClientRect();
    containerOffsetX = offset.left;
    containerOffsetY = offset.top;
    containerHeight = $container.clientHeight;
    containerWidth = $container.clientWidth;
    elementHeight = $element.clientHeight;
    elementWidth = $element.clientWidth;
    initialPointerOffsetX = e.touches[0].clientX;
    initialPointerOffsetY = e.touches[0].clientY;
    initialScale = minMax(parseFloat($element.getAttribute(_dataScale)), SCALE_MIN, SCALE_MAX);
    touchCount = e.touches.length;

    if (touchCount === 1) /* Single touch */ {
      /* Doubletap */
      if (doubleTapMonitor[0] === null) {
        doubleTapMonitor[0] = e.target;
        doubleTapMonitor[1] = initialPointerOffsetX;
        doubleTapMonitor[2] = initialPointerOffsetY;

        setTimeout(function () {
          doubleTapMonitor = [null];
        }, DOUBLECLICK_DELAY);
      } else if (doubleTapMonitor[0] === e.target && touchmoveCount <= 1 && isWithinRange(initialPointerOffsetX, doubleTapMonitor[1] - 10, doubleTapMonitor[1] + 10) === true && isWithinRange(initialPointerOffsetY, doubleTapMonitor[2] - 10, doubleTapMonitor[2] + 10) === true) {
        addClass($element, _transition);

        if (hasClass($container, _active) === true) {
          /* Set attributes */
          $element.setAttribute(_dataScale, 1);
          $element.setAttribute(_dataTranslateX, 0);
          $element.setAttribute(_dataTranslateY, 0);

          zoomInactive($container);

          moveScaleElement($element, 0, 0, 1);
        } else {
          pointerOffsetX = e.touches[0].clientX;
          pointerOffsetY = e.touches[0].clientY;
          targetScale = SCALE_DEFAULT;
          scaleDirection = 1;
          scaleDifference = (SCALE_DEFAULT - 1) * scaleDirection;

          /* Set offset limits */
          limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
          limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);

          if (targetScale <= 1) {
            targetOffsetX = 0;
            targetOffsetY = 0;
          } else {
            /* Set target offsets */
            targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(initialOffsetX - ((((((pointerOffsetX - containerOffsetX) - (containerWidth / 2)) - initialOffsetX) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
            targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(initialOffsetY - ((((((pointerOffsetY - containerOffsetY) - (containerHeight / 2)) - initialOffsetY) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
          }

          zoomActive($container);

          /* Set attributes */
          $element.setAttribute(_dataScale, targetScale);
          $element.setAttribute(_dataTranslateX, targetOffsetX);
          $element.setAttribute(_dataTranslateY, targetOffsetY);

          moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", SCALE_DEFAULT);
        }

        setTimeout(function () {
          removeClass($element, _transition);
        }, TRANSITION_DURATION);

        doubleTapMonitor = [null];
        return false;
      }

      /* Initialize helpers */
      initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
      initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
    } else if (touchCount === 2) /* Pinch */ {
      /* Initialize helpers */
      initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
      initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
      initialPointerOffsetX2 = e.touches[1].clientX;
      initialPointerOffsetY2 = e.touches[1].clientY;
      pinchOffsetX = (initialPointerOffsetX + initialPointerOffsetX2) / 2;
      pinchOffsetY = (initialPointerOffsetY + initialPointerOffsetY2) / 2;
      initialPinchDistance = Math.sqrt(((initialPointerOffsetX - initialPointerOffsetX2) * (initialPointerOffsetX - initialPointerOffsetX2)) + ((initialPointerOffsetY - initialPointerOffsetY2) * (initialPointerOffsetY - initialPointerOffsetY2)));
    }

    touchmoveCount = 0;

    /* Set capture */
    capture = true;
  }

  function touchMove(e) {
    preventDefault();

    if (capture === false) {
      return false;
    }

    /* Initialize helpers */
    pointerOffsetX = e.touches[0].clientX;
    pointerOffsetY = e.touches[0].clientY;
    touchCount = e.touches.length;
    touchmoveCount++;

    if (touchCount > 1) /* Pinch */ {
      pointerOffsetX2 = e.touches[1].clientX;
      pointerOffsetY2 = e.touches[1].clientY;
      targetPinchDistance = Math.sqrt(((pointerOffsetX - pointerOffsetX2) * (pointerOffsetX - pointerOffsetX2)) + ((pointerOffsetY - pointerOffsetY2) * (pointerOffsetY - pointerOffsetY2)));

      if (initialPinchDistance === null) {
        initialPinchDistance = targetPinchDistance;
      }

      if (Math.abs(initialPinchDistance - targetPinchDistance) >= 1) {
        /* Initialize helpers */
        targetScale = minMax(targetPinchDistance / initialPinchDistance * initialScale, SCALE_MIN, SCALE_MAX);
        limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
        limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);
        scaleDifference = targetScale - initialScale;
        targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(initialOffsetX - ((((((pinchOffsetX - containerOffsetX) - (containerWidth / 2)) - initialOffsetX) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
        targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(initialOffsetY - ((((((pinchOffsetY - containerOffsetY) - (containerHeight / 2)) - initialOffsetY) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);

        if (targetScale > 1) {
          zoomActive($container);
        } else {
          zoomInactive($container);
        }

        moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);

        /* Initialize helpers */
        initialPinchDistance = targetPinchDistance;
        initialScale = targetScale;
        initialOffsetX = targetOffsetX;
        initialOffsetY = targetOffsetY;
      }
    } else /* Single touch */ {
      /* Initialize helpers */
      targetScale = initialScale;
      limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
      limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);
      targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(pointerOffsetX - (initialPointerOffsetX - initialOffsetX), limitOffsetX * (-1), limitOffsetX);
      targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(pointerOffsetY - (initialPointerOffsetY - initialOffsetY), limitOffsetY * (-1), limitOffsetY);

      if (Math.abs(targetOffsetX) === Math.abs(limitOffsetX)) {
        initialOffsetX = targetOffsetX;
        initialPointerOffsetX = pointerOffsetX;
      }

      if (Math.abs(targetOffsetY) === Math.abs(limitOffsetY)) {
        initialOffsetY = targetOffsetY;
        initialPointerOffsetY = pointerOffsetY;
      }

      /* Set attributes */
      $element.setAttribute(_dataScale, initialScale);
      $element.setAttribute(_dataTranslateX, targetOffsetX);
      $element.setAttribute(_dataTranslateY, targetOffsetY);

      moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
    }
  }

  function touchEnd(e) {
    touchCount = e.touches.length;

    if (capture === false) {
      return false;
    }

    if (touchCount === 0) /* No touch */ {
      /* Set attributes */
      $element.setAttribute(_dataScale, initialScale);
      $element.setAttribute(_dataTranslateX, targetOffsetX);
      $element.setAttribute(_dataTranslateY, targetOffsetY);

      initialPinchDistance = null;
      capture = false;
    } else if (touchCount === 1) /* Single touch */ {
      initialPointerOffsetX = e.touches[0].clientX;
      initialPointerOffsetY = e.touches[0].clientY;
    } else if (touchCount > 1) /* Pinch */ {
      initialPinchDistance = null;
    }
  }

  function wheel(e) {
    /* Initialize selectors */
    $container = this;
    $element = this.children[0];

    /* Initialize helpers */
    offset = $container.getBoundingClientRect();
    containerHeight = $container.clientHeight;
    containerWidth = $container.clientWidth;
    elementHeight = $element.clientHeight;
    elementWidth = $element.clientWidth;
    containerOffsetX = offset.left;
    containerOffsetY = offset.top;
    initialScale = minMax(parseFloat($element.getAttribute(_dataScale), SCALE_MIN, SCALE_MAX));
    initialOffsetX = parseFloat($element.getAttribute(_dataTranslateX));
    initialOffsetY = parseFloat($element.getAttribute(_dataTranslateY));
    pointerOffsetX = e.clientX;
    pointerOffsetY = e.clientY;
    scaleDirection = e.deltaY < 0 ? 1 : -1;
    scaleDifference = SCALE_DIFFERENCE * scaleDirection;
    targetScale = initialScale + scaleDifference;

    /* Prevent scale overflow */
    if (targetScale < SCALE_MIN || targetScale > SCALE_MAX) {
      return false;
    }

    /* Set offset limits */
    limitOffsetX = getLimitOffset(elementWidth, containerWidth, targetScale);
    limitOffsetY = getLimitOffset(elementHeight, containerHeight, targetScale);

    if (targetScale <= 1) {
      targetOffsetX = 0;
      targetOffsetY = 0;
    } else {
      /* Set target offsets */
      targetOffsetX = (elementWidth * targetScale) <= containerWidth ? 0 : minMax(initialOffsetX - ((((((pointerOffsetX - containerOffsetX) - (containerWidth / 2)) - initialOffsetX) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetX * (-1), limitOffsetX);
      targetOffsetY = (elementHeight * targetScale) <= containerHeight ? 0 : minMax(initialOffsetY - ((((((pointerOffsetY - containerOffsetY) - (containerHeight / 2)) - initialOffsetY) / (targetScale - scaleDifference))) * scaleDifference), limitOffsetY * (-1), limitOffsetY);
    }

    if (targetScale > 1) {
      zoomActive($container);
    } else {
      zoomInactive($container);
    }

    /* Set attributes */
    $element.setAttribute(_dataScale, targetScale);
    $element.setAttribute(_dataTranslateX, targetOffsetX);
    $element.setAttribute(_dataTranslateY, targetOffsetY);

    moveScaleElement($element, targetOffsetX + "px", targetOffsetY + "px", targetScale);
  }

  function addClass($element, targetClass) {
    if (hasClass($element, targetClass) === false) {
      $element.className += " " + targetClass;
    }
  }

  function disableScroll() {
    if (!SCROLL_DISABLE) {
      return false;
    }

    window.addEventListener("DOMMouseScroll", preventDefault, false); // older FF
    window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
    window.addEventListener("touchmove", preventDefault, wheelOpt); // mobile
    window.addEventListener("keydown", preventDefaultForScrollKeys, false);
  }

  function enableScroll() {
    if (!SCROLL_DISABLE) {
      return false;
    }

    window.removeEventListener("DOMMouseScroll", preventDefault, false);
    window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
    window.removeEventListener("touchmove", preventDefault, wheelOpt);
    window.removeEventListener("keydown", preventDefaultForScrollKeys, false);
  }

  function isWithinRange(value, min, max) {
    return value >= min && value <= max;
  }

  function hasClass($element, targetClass) {
    var rgx = new RegExp("(?:^|\\s)" + targetClass + "(?!\\S)", "g");

    return !!$element.className.match(rgx);
  }

  function massAddEventListener($elements, event, customFunction, useCapture) {
    var useCapture = useCapture || false;

    for (var i = 0; i < $elements.length; i++) {
      $elements[i].addEventListener(event, customFunction, useCapture);
    }
  }

  function minMax(value, min, max) {
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    return value;
  }

  function moveScaleElement($element, targetOffsetX, targetOffsetY, targetScale) {
    if (SUPPORT_3D_TRANSFORM) {
      $element.style.cssText = "-moz-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") " + "scale(" + targetScale + "); " +
        "-ms-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") scale(" + targetScale + "); " +
        "-o-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") " + "scale(" + targetScale + "); " +
        "-webkit-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") " + "scale(" + targetScale + "); " +
        "transform : translate3d(" + targetOffsetX + ", " + targetOffsetY + ", 0) scale3d(" + targetScale + ", " + targetScale + ", 1);";
    } else {
      $element.style.cssText = "-moz-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") " + "scale(" + targetScale + "); " +
        "-ms-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") scale(" + targetScale + "); " +
        "-o-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") " + "scale(" + targetScale + "); " +
        "-webkit-transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") " + "scale(" + targetScale + "); " +
        "transform : translate(" + targetOffsetX + ", " + targetOffsetY + ") scale(" + targetScale + ", " + targetScale + ")";
    }
  }

  function preventDefault(e) {
    e = e || window.event;

    if (e.preventDefault) {
      e.preventDefault();
    }

    e.returnValue = false;
  }

  function preventDefaultForScrollKeys(e) {
    var keys = {
      37: 1,
      38: 1,
      39: 1,
      40: 1
    };

    if (keys[e.keyCode]) {
      preventDefault(e);
      return false;
    }
  }

  function removeClass($element, targetClass) {
    var rgx = new RegExp("(?:^|\\s)" + targetClass + "(?!\\S)", "g");

    $element.className = $element.className.replace(rgx, "");
  }

  function getLimitOffset(elementDimension, containerDimension, targetScale) {
    return ((elementDimension * targetScale) - containerDimension) / 2;
  }

  function zoomActive($container) {
    addClass($container, _active);

    if (callback) {
      callback($container, true);
    }
  }

  function zoomInactive($container) {
    removeClass($container, _active);

    if (callback) {
      callback($container, false);
    }
  }

  function iOSSafari() {
    if (["iPad Simulator", "iPhone Simulator", "iPod Simulator", "iPad", "iPhone", "iPod"].indexOf(navigator.platform) > -1 || (navigator.userAgent.includes("Mac") && "ontouchend" in document)) {
      var ua = navigator.userAgent.toLowerCase();

      if (ua.indexOf("safari") > -1 && ua.indexOf("chrome") === -1) {
        return true
      }
    }

    return false;
  }
}

if (typeof module !== "undefined") {
  module.exports = { zoom };
}