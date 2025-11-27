# Export Scripts for Figma

Copy and paste these into your browser console on the live site.

## 1. Export Fretboard Only (SVG)

```javascript
var svg = document.querySelector('svg');
var svgData = new XMLSerializer().serializeToString(svg);
var blob = new Blob([svgData], {type: 'image/svg+xml'});
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = 'fretboard.svg';
a.click();
URL.revokeObjectURL(url);
```

## 2. Export All Components

This loads a library first, then exports multiple elements:

```javascript
var s = document.createElement('script');
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
s.onload = function() {
  var opts = {
    backgroundColor: '#262626',
    style: {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    skipFonts: true,
    pixelRatio: 2
  };

  function dl(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  var svg = document.querySelector('svg');
  var svgData = new XMLSerializer().serializeToString(svg);
  dl(new Blob([svgData], {type: 'image/svg+xml'}), 'fretboard.svg');

  var cd = document.querySelector('[class*="chordDisplay"]');
  if (cd) {
    htmlToImage.toBlob(cd, opts).then(function(b) { dl(b, 'chord-display.png'); });
  }

  var cp = document.querySelector('[class*="controlPanel"]');
  if (cp) {
    htmlToImage.toBlob(cp, opts).then(function(b) { dl(b, 'control-panel.png'); });
  }

  var app = document.querySelector('.app');
  if (app) {
    htmlToImage.toBlob(app, {backgroundColor: '#171717', skipFonts: true, pixelRatio: 2}).then(function(b) {
      dl(b, 'full-app.png');
    });
  }

  console.log('Exporting files...');
};
document.head.appendChild(s);
```

## 3. Export Individual Controls

Run after loading the library (run script 2 first, then these):

### Dropdowns
```javascript
var selects = document.querySelectorAll('select');
selects.forEach(function(sel, i) {
  htmlToImage.toBlob(sel.parentElement, {backgroundColor: '#262626'}).then(function(b) {
    var url = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dropdown-' + i + '.png';
    a.click();
  });
});
```

### Buttons
```javascript
var buttons = document.querySelectorAll('button');
buttons.forEach(function(btn, i) {
  htmlToImage.toBlob(btn, {backgroundColor: '#262626'}).then(function(b) {
    var url = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'button-' + i + '.png';
    a.click();
  });
});
```

## Notes

- The fretboard exports as SVG (vector, editable in Figma)
- HTML elements export as PNG (raster)
- Set up desired chord/notes before exporting to capture that state
- Drag exported files directly into Figma
