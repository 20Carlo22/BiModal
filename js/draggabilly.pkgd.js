( function( window ) {


function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {

  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,

  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

if ( typeof define === 'function' && define.amd ) {

  define( 'classie/classie',classie );
} else {

  window.classie = classie;
}

})( window );

(function () {
	

	function EventEmitter() {}

	var proto = EventEmitter.prototype;

	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		if (typeof evt === 'object') {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	proto.on = alias('addListener');

	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	proto.once = alias('addOnceListener');

	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	proto.off = alias('removeListener');

	proto.addListeners = function addListeners(evt, listeners) {

		return this.manipulateListeners(false, evt, listeners);
	};

	proto.removeListeners = function removeListeners(evt, listeners) {

		return this.manipulateListeners(true, evt, listeners);
	};

	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;


		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {

					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {

						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		if (type === 'string') {
			delete events[evt];
		}
		else if (type === 'object') {
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			delete this._events;
		}

		return this;
	};

	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					listener = listeners[key][i];
					response = listener.listener.apply(this, args || []);
					if (response === this._getOnceReturnValue() || listener.once === true) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	proto.trigger = alias('emitEvent');

	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	if (typeof define === 'function' && define.amd) {
		define('eventEmitter/EventEmitter',[],function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));


( function( window ) {



var docElem = document.documentElement;

var bind = function() {};

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = window.event;
        // add event.target
        event.target = event.target || event.srcElement;
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = window.event;
        // add event.target
        event.target = event.target || event.srcElement;
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

if ( typeof define === 'function' && define.amd ) {
  define( 'eventie/eventie',eventie );
} else {
  window.eventie = eventie;
}

})( this );


( function( window ) {



var prefixes = 'Webkit Moz ms Ms O'.split(' ');
var docElemStyle = document.documentElement.style;

function getStyleProperty( propName ) {
  if ( !propName ) {
    return;
  }

  if ( typeof docElemStyle[ propName ] === 'string' ) {
    return propName;
  }

  propName = propName.charAt(0).toUpperCase() + propName.slice(1);

  var prefixed;
  for ( var i=0, len = prefixes.length; i < len; i++ ) {
    prefixed = prefixes[i] + propName;
    if ( typeof docElemStyle[ prefixed ] === 'string' ) {
      return prefixed;
    }
  }
}

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( 'get-style-property/get-style-property',[],function() {
    return getStyleProperty;
  });
} else {
  window.getStyleProperty = getStyleProperty;
}

})( window );


( function( window, undefined ) {




var defView = document.defaultView;

var getStyle = defView && defView.getComputedStyle ?
  function( elem ) {
    return defView.getComputedStyle( elem, null );
  } :
  function( elem ) {
    return elem.currentStyle;
  };

function getStyleSize( value ) {
  var num = parseFloat( value );
  // not a percent like '100%', and a number
  var isValid = value.indexOf('%') === -1 && !isNaN( num );
  return isValid && num;
}


var measurements = [
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'borderBottomWidth'
];

function getZeroSize() {
  var size = {
    width: 0,
    height: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0
  };
  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    size[ measurement ] = 0;
  }
  return size;
}



function defineGetSize( getStyleProperty ) {


var boxSizingProp = getStyleProperty('boxSizing');
var isBoxSizeOuter;

( function() {
  if ( !boxSizingProp ) {
    return;
  }

  var div = document.createElement('div');
  div.style.width = '200px';
  div.style.padding = '1px 2px 3px 4px';
  div.style.borderStyle = 'solid';
  div.style.borderWidth = '1px 2px 3px 4px';
  div.style[ boxSizingProp ] = 'border-box';

  var body = document.body || document.documentElement;
  body.appendChild( div );
  var style = getStyle( div );

  isBoxSizeOuter = getStyleSize( style.width ) === 200;
  body.removeChild( div );
})();



function getSize( elem ) {
  if ( typeof elem === 'string' ) {
    elem = document.querySelector( elem );
  }

  if ( !elem || typeof elem !== 'object' || !elem.nodeType ) {
    return;
  }

  var style = getStyle( elem );

  if ( style.display === 'none' ) {
    return getZeroSize();
  }

  var size = {};
  size.width = elem.offsetWidth;
  size.height = elem.offsetHeight;

  var isBorderBox = size.isBorderBox = !!( boxSizingProp &&
    style[ boxSizingProp ] && style[ boxSizingProp ] === 'border-box' );

  for ( var i=0, len = measurements.length; i < len; i++ ) {
    var measurement = measurements[i];
    var value = style[ measurement ];
    var num = parseFloat( value );
    size[ measurement ] = !isNaN( num ) ? num : 0;
  }

  var paddingWidth = size.paddingLeft + size.paddingRight;
  var paddingHeight = size.paddingTop + size.paddingBottom;
  var marginWidth = size.marginLeft + size.marginRight;
  var marginHeight = size.marginTop + size.marginBottom;
  var borderWidth = size.borderLeftWidth + size.borderRightWidth;
  var borderHeight = size.borderTopWidth + size.borderBottomWidth;

  var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

  var styleWidth = getStyleSize( style.width );
  if ( styleWidth !== false ) {
    size.width = styleWidth +
      ( isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth );
  }

  var styleHeight = getStyleSize( style.height );
  if ( styleHeight !== false ) {
    size.height = styleHeight +
      ( isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight );
  }

  size.innerWidth = size.width - ( paddingWidth + borderWidth );
  size.innerHeight = size.height - ( paddingHeight + borderHeight );

  size.outerWidth = size.width + marginWidth;
  size.outerHeight = size.height + marginHeight;

  return size;
}

return getSize;

}

if ( typeof define === 'function' && define.amd ) {
  define( 'get-size/get-size',[ 'get-style-property/get-style-property' ], defineGetSize );
} else {
  window.getSize = defineGetSize( window.getStyleProperty );
}

})( window );

( function( window ) {



// vars
var document = window.document;


function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

function noop() {}


var defView = document.defaultView;

var getStyle = defView && defView.getComputedStyle ?
  function( elem ) {
    return defView.getComputedStyle( elem, null );
  } :
  function( elem ) {
    return elem.currentStyle;
  };


// http://stackoverflow.com/a/384380/182183
var isElement = ( typeof HTMLElement === 'object' ) ?
  function isElementDOM2( obj ) {
    return obj instanceof HTMLElement;
  } :
  function isElementQuirky( obj ) {
    return obj && typeof obj === 'object' &&
      obj.nodeType === 1 && typeof obj.nodeName === 'string';
  };


var lastTime = 0;
var prefixes = 'webkit moz ms o'.split(' ');
var requestAnimationFrame = window.requestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame;
var prefix;
for( var i = 0; i < prefixes.length; i++ ) {
  if ( requestAnimationFrame && cancelAnimationFrame ) {
    break;
  }
  prefix = prefixes[i];
  requestAnimationFrame = requestAnimationFrame || window[ prefix + 'RequestAnimationFrame' ];
  cancelAnimationFrame  = cancelAnimationFrame  || window[ prefix + 'CancelAnimationFrame' ] ||
                            window[ prefix + 'CancelRequestAnimationFrame' ];
}

if ( !requestAnimationFrame || !cancelAnimationFrame )  {
  requestAnimationFrame = function( callback ) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
    var id = window.setTimeout( function() {
      callback( currTime + timeToCall );
    }, timeToCall );
    lastTime = currTime + timeToCall;
    return id;
  };

  cancelAnimationFrame = function( id ) {
    window.clearTimeout( id );
  };
}


function draggabillyDefinition( classie, EventEmitter, eventie, getStyleProperty, getSize ) {


var transformProperty = getStyleProperty('transform');
var is3d = !!getStyleProperty('perspective');


function Draggabilly( element, options ) {
  // querySelector if string
  this.element = typeof element === 'string' ?
    document.querySelector( element ) : element;

  this.options = extend( {}, this.options );
  extend( this.options, options );

  this._create();
}

extend( Draggabilly.prototype, EventEmitter.prototype );

Draggabilly.prototype.options = {
};

Draggabilly.prototype._create = function() {

  this.position = {};
  this._getPosition();

  this.startPoint = { x: 0, y: 0 };
  this.dragPoint = { x: 0, y: 0 };

  this.startPosition = extend( {}, this.position );

  var style = getStyle( this.element );
  if ( style.position !== 'relative' && style.position !== 'absolute' ) {
    this.element.style.position = 'relative';
  }

  this.enable();
  this.setHandles();

};

Draggabilly.prototype.setHandles = function() {
  this.handles = this.options.handle ?
    this.element.querySelectorAll( this.options.handle ) : [ this.element ];

  this.bindHandles( true );
};


Draggabilly.prototype.bindHandles = function( isBind ) {
  var binder;
  if ( window.navigator.pointerEnabled ) {
    binder = this.bindPointer;
  } else if ( window.navigator.msPointerEnabled ) {
    binder = this.bindMSPointer;
  } else {
    binder = this.bindMouseTouch;
  }
  isBind = isBind === undefined ? true : !!isBind;
  for ( var i=0, len = this.handles.length; i < len; i++ ) {
    var handle = this.handles[i];
    binder.call( this, handle, isBind );
  }
};

Draggabilly.prototype.bindPointer = function( handle, isBind ) {
  var bindMethod = isBind ? 'bind' : 'unbind';
  eventie[ bindMethod ]( handle, 'pointerdown', this );
  handle.style.touchAction = isBind ? 'none' : '';
};

Draggabilly.prototype.bindMSPointer = function( handle, isBind ) {
  var bindMethod = isBind ? 'bind' : 'unbind';
  eventie[ bindMethod ]( handle, 'MSPointerDown', this );
  handle.style.msTouchAction = isBind ? 'none' : '';
};

Draggabilly.prototype.bindMouseTouch = function( handle, isBind ) {
  var bindMethod = isBind ? 'bind' : 'unbind';
  eventie[ bindMethod ]( handle, 'mousedown', this );
  eventie[ bindMethod ]( handle, 'touchstart', this );
  if ( isBind ) {
    disableImgOndragstart( handle );
  }
};


function noDragStart() {
  return false;
}

var isIE8 = 'attachEvent' in document.documentElement;

var disableImgOndragstart = !isIE8 ? noop : function( handle ) {

  if ( handle.nodeName === 'IMG' ) {
    handle.ondragstart = noDragStart;
  }

  var images = handle.querySelectorAll('img');
  for ( var i=0, len = images.length; i < len; i++ ) {
    var img = images[i];
    img.ondragstart = noDragStart;
  }
};


Draggabilly.prototype._getPosition = function() {
  var style = getStyle( this.element );

  var x = parseInt( style.left, 10 );
  var y = parseInt( style.top, 10 );

  this.position.x = isNaN( x ) ? 0 : x;
  this.position.y = isNaN( y ) ? 0 : y;

  this._addTransformPosition( style );
};

Draggabilly.prototype._addTransformPosition = function( style ) {
  if ( !transformProperty ) {
    return;
  }
  var transform = style[ transformProperty ];
  if ( transform.indexOf('matrix') !== 0 ) {
    return;
  }
  var matrixValues = transform.split(',');
  var xIndex = transform.indexOf('matrix3d') === 0 ? 12 : 4;
  var translateX = parseInt( matrixValues[ xIndex ], 10 );
  var translateY = parseInt( matrixValues[ xIndex + 1 ], 10 );
  this.position.x += translateX;
  this.position.y += translateY;
};


// trigger handler methods for events
Draggabilly.prototype.handleEvent = function( event ) {
  var method = 'on' + event.type;
  if ( this[ method ] ) {
    this[ method ]( event );
  }
};

Draggabilly.prototype.getTouch = function( touches ) {
  for ( var i=0, len = touches.length; i < len; i++ ) {
    var touch = touches[i];
    if ( touch.identifier === this.pointerIdentifier ) {
      return touch;
    }
  }
};


Draggabilly.prototype.onmousedown = function( event ) {
  var button = event.button;
  if ( button && ( button !== 0 && button !== 1 ) ) {
    return;
  }
  this.dragStart( event, event );
};

Draggabilly.prototype.ontouchstart = function( event ) {
  if ( this.isDragging ) {
    return;
  }

  this.dragStart( event, event.changedTouches[0] );
};

Draggabilly.prototype.onMSPointerDown =
Draggabilly.prototype.onpointerdown = function( event ) {
  if ( this.isDragging ) {
    return;
  }

  this.dragStart( event, event );
};

function setPointerPoint( point, pointer ) {
  point.x = pointer.pageX !== undefined ? pointer.pageX : pointer.clientX;
  point.y = pointer.pageY !== undefined ? pointer.pageY : pointer.clientY;
}

var postStartEvents = {
  mousedown: [ 'mousemove', 'mouseup' ],
  touchstart: [ 'touchmove', 'touchend', 'touchcancel' ],
  pointerdown: [ 'pointermove', 'pointerup', 'pointercancel' ],
  MSPointerDown: [ 'MSPointerMove', 'MSPointerUp', 'MSPointerCancel' ]
};

Draggabilly.prototype.dragStart = function( event, pointer ) {
  if ( !this.isEnabled ) {
    return;
  }

  if ( event.preventDefault ) {
    event.preventDefault();
  } else {
    event.returnValue = false;
  }

  this.pointerIdentifier = pointer.pointerId !== undefined ?
    pointer.pointerId : pointer.identifier;

  this._getPosition();

  this.measureContainment();

  setPointerPoint( this.startPoint, pointer );
  this.startPosition.x = this.position.x;
  this.startPosition.y = this.position.y;

  this.setLeftTop();

  this.dragPoint.x = 0;
  this.dragPoint.y = 0;

  this._bindEvents({
    events: postStartEvents[ event.type ],
    node: event.preventDefault ? window : document
  });

  classie.add( this.element, 'is-dragging' );

  this.isDragging = true;

  this.emitEvent( 'dragStart', [ this, event, pointer ] );

  this.animate();
};

Draggabilly.prototype._bindEvents = function( args ) {
  for ( var i=0, len = args.events.length; i < len; i++ ) {
    var event = args.events[i];
    eventie.bind( args.node, event, this );
  }
  this._boundEvents = args;
};

Draggabilly.prototype._unbindEvents = function() {
  var args = this._boundEvents;
  if ( !args || !args.events ) {
    return;
  }

  for ( var i=0, len = args.events.length; i < len; i++ ) {
    var event = args.events[i];
    eventie.unbind( args.node, event, this );
  }
  delete this._boundEvents;
};

Draggabilly.prototype.measureContainment = function() {
  var containment = this.options.containment;
  if ( !containment ) {
    return;
  }

  this.size = getSize( this.element );
  var elemRect = this.element.getBoundingClientRect();

  var container = isElement( containment ) ? containment :
    typeof containment === 'string' ? document.querySelector( containment ) :
    this.element.parentNode;

  this.containerSize = getSize( container );
  var containerRect = container.getBoundingClientRect();

  this.relativeStartPosition = {
    x: elemRect.left - containerRect.left,
    y: elemRect.top  - containerRect.top
  };
};


Draggabilly.prototype.onmousemove = function( event ) {
  this.dragMove( event, event );
};

Draggabilly.prototype.onMSPointerMove =
Draggabilly.prototype.onpointermove = function( event ) {
  if ( event.pointerId === this.pointerIdentifier ) {
    this.dragMove( event, event );
  }
};

Draggabilly.prototype.ontouchmove = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this.dragMove( event, touch );
  }
};

Draggabilly.prototype.dragMove = function( event, pointer ) {

  setPointerPoint( this.dragPoint, pointer );
  var dragX = this.dragPoint.x - this.startPoint.x;
  var dragY = this.dragPoint.y - this.startPoint.y;

  var grid = this.options.grid;
  var gridX = grid && grid[0];
  var gridY = grid && grid[1];

  dragX = applyGrid( dragX, gridX );
  dragY = applyGrid( dragY, gridY );

  dragX = this.containDrag( 'x', dragX, gridX );
  dragY = this.containDrag( 'y', dragY, gridY );

  dragX = this.options.axis === 'y' ? 0 : dragX;
  dragY = this.options.axis === 'x' ? 0 : dragY;

  this.position.x = this.startPosition.x + dragX;
  this.position.y = this.startPosition.y + dragY;
  this.dragPoint.x = dragX;
  this.dragPoint.y = dragY;

  this.emitEvent( 'dragMove', [ this, event, pointer ] );
};

function applyGrid( value, grid, method ) {
  method = method || 'round';
  return grid ? Math[ method ]( value / grid ) * grid : value;
}

Draggabilly.prototype.containDrag = function( axis, drag, grid ) {
  if ( !this.options.containment ) {
    return drag;
  }
  var measure = axis === 'x' ? 'width' : 'height';

  var rel = this.relativeStartPosition[ axis ];
  var min = applyGrid( -rel, grid, 'ceil' );
  var max = this.containerSize[ measure ] - rel - this.size[ measure ];
  max = applyGrid( max, grid, 'floor' );
  return  Math.min( max, Math.max( min, drag ) );
};


Draggabilly.prototype.onmouseup = function( event ) {
  this.dragEnd( event, event );
};

Draggabilly.prototype.onMSPointerUp =
Draggabilly.prototype.onpointerup = function( event ) {
  if ( event.pointerId === this.pointerIdentifier ) {
    this.dragEnd( event, event );
  }
};

Draggabilly.prototype.ontouchend = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  if ( touch ) {
    this.dragEnd( event, touch );
  }
};

Draggabilly.prototype.dragEnd = function( event, pointer ) {
  this.isDragging = false;

  delete this.pointerIdentifier;

  if ( transformProperty ) {
    this.element.style[ transformProperty ] = '';
    this.setLeftTop();
  }

  this._unbindEvents();

  classie.remove( this.element, 'is-dragging' );

  this.emitEvent( 'dragEnd', [ this, event, pointer ] );

};

Draggabilly.prototype.onMSPointerCancel =
Draggabilly.prototype.onpointercancel = function( event ) {
  if ( event.pointerId === this.pointerIdentifier ) {
    this.dragEnd( event, event );
  }
};

Draggabilly.prototype.ontouchcancel = function( event ) {
  var touch = this.getTouch( event.changedTouches );
  this.dragEnd( event, touch );
};


Draggabilly.prototype.animate = function() {
  if ( !this.isDragging ) {
    return;
  }

  this.positionDrag();

  var _this = this;
  requestAnimationFrame( function animateFrame() {
    _this.animate();
  });

};

var translate = is3d ?
  function( x, y ) {
    return 'translate3d( ' + x + 'px, ' + y + 'px, 0)';
  } :
  function( x, y ) {
    return 'translate( ' + x + 'px, ' + y + 'px)';
  };

Draggabilly.prototype.setLeftTop = function() {
  this.element.style.left = this.position.x + 'px';
  this.element.style.top  = this.position.y + 'px';
};

Draggabilly.prototype.positionDrag = transformProperty ?
  function() {
    this.element.style[ transformProperty ] = translate( this.dragPoint.x, this.dragPoint.y );
  } : Draggabilly.prototype.setLeftTop;


Draggabilly.prototype.enable = function() {
  this.isEnabled = true;
};

Draggabilly.prototype.disable = function() {
  this.isEnabled = false;
  if ( this.isDragging ) {
    this.dragEnd();
  }
};

Draggabilly.prototype.destroy = function() {
  this.disable();
  if ( transformProperty ) {
    this.element.style[ transformProperty ] = '';
  }
  this.element.style.left = '';
  this.element.style.top = '';
  this.element.style.position = '';
  // unbind handles
  this.bindHandles( false );
};


return Draggabilly;

}

if ( typeof define === 'function' && define.amd ) {
  define( [
      'classie/classie',
      'eventEmitter/EventEmitter',
      'eventie/eventie',
      'get-style-property/get-style-property',
      'get-size/get-size'
    ],
    draggabillyDefinition );
} else if ( typeof exports === 'object' ) {
  module.exports = draggabillyDefinition(
    require('desandro-classie'),
    require('wolfy87-eventemitter'),
    require('eventie'),
    require('desandro-get-style-property'),
    require('get-size')
  );
} else {
  window.Draggabilly = draggabillyDefinition(
    window.classie,
    window.EventEmitter,
    window.eventie,
    window.getStyleProperty,
    window.getSize
  );
}

})( window );

