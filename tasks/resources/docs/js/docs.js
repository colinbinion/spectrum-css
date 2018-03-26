/* eslint-disable no-unused-vars */
/* global document, window, Element, AdobeSpectrum */

'use strict';

// Polyfill closest() on IE 11
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    var ancestor = this;
    if (!document.documentElement.contains(el)) return null;
    do {
      if (ancestor.matches(s)) return ancestor;
      ancestor = ancestor.parentElement;
    } while (ancestor !== null);
    return null;
  };
}

function changeCSS(colorStop) {
  document.body.className = 'spectrum spectrum--'+colorStop;
}

function openDialog(dialog, withOverlay) {
  if (withOverlay !== false) {
    document.getElementById('spectrum-underlay').classList.add('is-open');
  }

  dialog.classList.add('is-open');
}

function closeDialog(dialog) {
  document.getElementById('spectrum-underlay').classList.remove('is-open');
  dialog.classList.remove('is-open');
}

document.addEventListener('DOMContentLoaded', function() {
  changeCSS('light');
});

// Show and hide code samples
function toggleMarkupVisibility(event) {
  event.preventDefault();
  var exampleMarkup = event.target.closest('.sdldocs-component').querySelector('.sdldocs-code-example');
  var style = window.getComputedStyle(exampleMarkup);
  var isHidden = style.getPropertyValue('display') === 'none';
  event.target.innerHTML = isHidden ? 'hide markup' : 'show markup';
  exampleMarkup.style.display = isHidden ? 'block' : 'none';
}

document.addEventListener('click', function(event) {
  if (event.target.classList.contains('sdldocs-code-link')) {
    toggleMarkupVisibility(event);
  }
});

window.addEventListener('click', function(event) {
  var el;
  if ((el = event.target.closest('.spectrum-TreeView-item')) !== null) {
    el.classList.toggle('is-open');
    event.preventDefault();
  }
});

// Display Slider focus style
function toggleSliderFocus(event) {
  if (!event.target.classList.contains('spectrum-Slider-input')) {
    return;
  }
  var func = event.type === 'focus' ? 'add' : 'remove';
  var handle = event.target.closest('.spectrum-Slider-handle');
  handle.classList[func]('is-focused');
}

var currentTitle = null;
function setHashFromScroll() {
  var scrollTop = document.documentElement.scrollTop;
  var titles = document.getElementsByClassName('js-hashtitle');
  var minTitleCloseness = Infinity;
  var closestTitle = null;
  for (var i = 0; i < titles.length; i++) {
    var title = titles[i];
    var titleCloseness = Math.abs(scrollTop - title.offsetTop);
    if (titleCloseness < minTitleCloseness) {
      minTitleCloseness = titleCloseness;
      closestTitle = title;
    }

    if (closestTitle !== null && titleCloseness > minTitleCloseness) {
      // We're not finding closer titles now
      break;
    }
  }
  if (closestTitle) {
    window.history.pushState({}, '', closestTitle.getAttribute('href'));
    currentTitle = closestTitle;
  }
}

window.ignoreScroll = false;

var curScale = 'medium';
var curMethod = 'rem-auto';
var scaleAbbreviations = {
  'medium': 'md',
  'large': 'lg'
};
function changeScale(scale, method) {
  // Set the hash while changing scales
  // setHashFromScroll();

  method = method || curMethod;
  scale = scale || curScale;

  if (method === 'rem' || method === 'rem-auto') {
    var diffLink = document.querySelector('link[data-spectrum-core-diff]');
    if (method === 'rem-auto') {
      if (diffLink.getAttribute('href') !== '../spectrum-core-diff.css') {
        diffLink.setAttribute('href', '../spectrum-core-diff.css');
      }
    }
    else {
      // Remove auto diffs
      if (diffLink.getAttribute('href') !== '') {
        diffLink.setAttribute('href', '');
      }
    }

    var coreLink = document.querySelector('link[data-spectrum-core]');
    if (coreLink.getAttribute('href') !== '../spectrum-core-md.css') {
      coreLink.setAttribute('href', '../spectrum-core-md.css');
    }

    Object.keys(scaleAbbreviations).forEach(function(otherScale) {
      if (otherScale !== scale) {
        document.documentElement.classList.remove('spectrum--' + otherScale);
      }
    });
    document.documentElement.classList.add('spectrum--' + scale);
  }
  else if (method === 'token') {
    document.querySelector('link[data-spectrum-core]').setAttribute('href', '../spectrum-core-' + scaleAbbreviations[scale] + '.css');
    document.querySelector('link[data-spectrum-core-diff]').setAttribute('href', '');
    Object.keys(scaleAbbreviations).forEach(function(otherScale) {
      document.documentElement.classList.remove('spectrum--' + otherScale);
    });
  }

  // Swap out icons
  var uiIcons = scale === 'medium' ? mediumIcons : largeIcons;
  var oldUIIcons = scale != 'medium' ? mediumIcons : largeIcons;
  document.head.insertBefore(uiIcons, null);
  if (oldUIIcons.parentElement) {
    oldUIIcons.parentElement.removeChild(oldUIIcons);
  }

  // Scroll to the same place we were before
  var count = 0;
  window.ignoreScroll = true;
  document.documentElement.scrollTop = currentTitle.offsetTop;
  var interval = window.setInterval(function() {
    document.documentElement.scrollTop = currentTitle.offsetTop;
    count++;
    if (count > 50) {
      clearInterval(interval);
      window.ignoreScroll = false;
    }
  }, 10);

  curScale = scale;
  curMethod = method;
}

window.addEventListener('DOMContentLoaded', function() {
  if (window.location.hash) {
    // Scroll to the hash
    // This is required for refreshes when the size is changed
    var el = document.querySelector(window.location.hash);
    if (el) {
      document.documentElement.scrollTop = el.offsetTop;
    }
  }
  else {
    // Otherwise, make it #official
    setHashFromScroll();
  }

  // Set the hash while scrolling
  var scrollTimeout = null;
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    if (window.ignoreScroll) {
      return;
    }
    scrollTimeout = setTimeout(setHashFromScroll, 250);
  });

});

document.addEventListener('focus', toggleSliderFocus, true);
document.addEventListener('blur', toggleSliderFocus, true);

// Load and store references to icon SVGs
var mediumIcons;
var largeIcons;
AdobeSpectrum.loadIcons('../icons/spectrum-css-icons-medium.svg', function(err, svg) {
  mediumIcons = svg;
});
AdobeSpectrum.loadIcons('../icons/spectrum-css-icons-large.svg', function(err, svg) {
  largeIcons = svg;

  // Immediately remove from the DOM -- it will be added back when we switch scale
  largeIcons.parentElement.removeChild(largeIcons);
});
AdobeSpectrum.loadIcons('../icons/spectrum-icons.svg');
