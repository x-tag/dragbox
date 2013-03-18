/* 

Specs
============================
https://etherpad.mozilla.org/dragbox-specs

*/
(function() {
	var tagRegex = /x-dragbox/i,
		dragElement;

	function standardGet(attr) {
		return function() {
			return this.hasAttribute(attr) ? this.getAttribute(attr) : false;
		};
	}

	function standardSet(attr) {
		return function(value) {
			return value ? this.setAttribute(attr, value) : this.removeAttribute(attr);
		};
	}

	function standardGetSet(attr) {
		return {
			get: standardGet(attr),
			set: standardSet(attr)
		};
	}

	xtag.register('x-dragbox', {
		lifecycle: {
			created: function(){
				var self = this;
				this.makeSortable(this.getDropElement().children);
				xtag.addObserver(this, 'inserted', function(element){
					if (element.parentNode == self.getDropElement()) {
						self.makeSortable([element]);
					}
				});
			}
		},
		prototype: {},
		accessors: {
			sortable: { // "true" or "false"
				get: function() {
					return !!this.getAttribute('sortable');
				},
				set: function(state) {
					return !!state ? this.setAttribute('sortable', null) : this.removeAttribute('sortable');
				}
			},
			dropPosition: {
				get: function() {
					return this.getAttribute('drop-position') || 'bottom';
				},
				set: standardSet('drop-position')
			},
			dragElements: standardGetSet('drag-elements'),
			dropElement: standardGetSet('drop-element'),
			preventDrop: standardGetSet('prevent-drop'),
			preventDrag: standardGetSet('prevent-drag')
		},
		methods: {
			makeSortable:  function(elements) {
				var self = this;
				xtag.toArray(elements).forEach(function(el) {
					var dragElementSelector = self.dragElements;
					if(!dragElementSelector || xtag.matchSelector(el, dragElementSelector)) { 
						el.setAttribute('draggable', 'true'); 
					}
				});
			},
			getDropElement: function() {
				var selector = this.dropElement;
				return (selector) ? xtag.queryChildren(this, selector)[0] || this : this;
			}
		},
		events: {
			dragstart: function(event){
				var preventDragSelector = this.preventDrag,
					target = event.target;
				if (target.parentNode == this.getDropElement() && (!preventDragSelector || !xtag.matchSelector(target, preventDragSelector))){
					dragElement = target;
					xtag.addClass(dragElement, 'x-dragbox-drag-origin');
					event.dataTransfer.effectAllowed = 'move';
					event.dataTransfer.dropEffect = 'move';
					event.dataTransfer.setData('text/html', this.innerHTML);
				}
			},
			dragenter: function(event){
				var target = event.target;
				if (target.parentNode.tagName.match(tagRegex)){
					xtag.addClass(target, 'x-dragbox-drag-over');
				}
			},
			dragover: function(event){
				if (event.preventDefault) event.preventDefault();
				event.dataTransfer.dropEffect = 'move';  // ? need
				return false;
			},
			dragleave: function(event){
				var target = event.target;
				if(target.nodeType == 1) { // Text nodes encountered, removeClass will bomb
					xtag.removeClass(target, 'x-dragbox-drag-over');
				}
			},
			drop: function(event) {
				event.stopPropagation();

				// There are cases where absolutely no drop is allowed
				if(!dragElement) return;

				// Don't allow selectors that have been explicity identified as no-go's
				var preventDropSelector = this.preventDrop;
				if(preventDropSelector && xtag.matchSelector(dragElement, preventDropSelector)) return;

				var target = event.target,
					parent = target.parentNode,
					position = this.dropPosition,
					dropElement = this.getDropElement(),
					children = xtag.toArray(dropElement.children);

				// Remove CSS class regardless
				xtag.removeClass(target, 'x-dragbox-drag-over');

				// If a draggable was dropped *internally*
				if(dropElement == dragElement.parentNode) {
					if(!this.sortable) return; // is this correct usage per spec?

					// Put into position based on to/from logic (i.e. dragged in from left or right)
					position = children.indexOf(dragElement) > children.indexOf(target) ? target : target.nextSibling;
					if(dropElement != position) {
						dropElement.insertBefore(dragElement, position);
					}
				}
				// These will only be executed if moved to another box
				else {
					var relativeElement = position == 'top'? children[0] || target : target;

					if(position == 'bottom' || children.indexOf(relativeElement) == -1) {
						dropElement.appendChild(dragElement);
					}
					else {
						dropElement.insertBefore(dragElement, relativeElement);
					}
				}
			},
			dragdrop: function(event){
				// DO NOT USE THIS -- NOT SUPPORTED IN ALL BROWSERS (i.e. chrome)
			},
			dragend: function(event){
				event.stopPropagation();
				xtag.removeClass(event.target, 'x-dragbox-drag-origin');
			}
		}
	});
})();