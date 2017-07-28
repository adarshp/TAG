class Link {
    constructor(eventId, trigger, args, reltype, top = true) {
      this.eventId = eventId;
      this.trigger = trigger;
      this.arguments = args.sort((a,b) => a.anchor.idx - b.anchor.idx);
      this.links = [];
      this.reltype = reltype;
      this.top = top;
      this.visible = true;

      this.slot = 0;

      if (this.top) {
        // top links
        if (this.trigger) {
          this.trigger.links.push(this);
          this.slot = this.trigger.slot;
        }
        this.arguments.forEach(arg => {
          arg.anchor.links.push(this);
          if (arg.anchor.slot > this.slot) {
            this.slot = arg.anchor.slot;
          }
        });

        this.slot += 1;
      }
      else {
        // bottom links
        this.trigger.links.push(this);
        this.slot = -1;
        this.arguments.forEach(arg => arg.anchor.links.push(this));
      }
      this.endpoints = this.getEndpoints();

      this.mainSVG = null;
      this.svg = null;
      this.handles = [];
      this.line = null;
      this.svgTexts = [];
    }

    init(svg, words) {
      this.mainSVG = svg;
      this.svg = svg.group().addClass(this.top ? 'link' : 'link syntax-link');
      this.recalculateSlots(words);

      // init handles
      // get location of trigger
      if (this.trigger) {
        let offset = this.trigger.links.filter(l => l.top == this.top).indexOf(this);
        let x = this.trigger.cx + 8 * offset;
        let y = this.top ? this.trigger.absoluteY : this.trigger.absoluteDescent;
        this.handles.push({ anchor: this.trigger, x, y, offset });
      }

      // draw arguments
      this.arguments.forEach(arg => {
        // get location of the argument
        let offset = arg.anchor.links.filter(l => l.top == this.top).indexOf(this);
        let x = arg.anchor.cx + 8 * offset;
        let y = this.top ? arg.anchor.absoluteY : arg.anchor.absoluteDescent;
        this.handles.push({ anchor: arg.anchor, x, y, offset });

        // draw svgText for each trigger-argument relation
        if (this.trigger) {
          let text = this.svg.text(arg.type)
            .y(-7)
            .addClass('link-text');
          this.svgTexts.push(text);
        }
      });

      // draw svgText for a non-trigger relation
      if (this.reltype) {
        let text = this.svg.text(this.reltype)
          .y(-7)
          .addClass('link-text');
        this.svgTexts.push(text);
      }

      this.line = this.svg.path()
        .addClass('polyline');
      this.draw();
    }

    toggle() {
      this.visible = !this.visible;
      if (this.visible) { this.show(); }
      else { this.hide(); }
    }
    show() {
      this.visible = true;
      if (this.svg) {
        this.svg.show();
        this.draw();
      }
    }
    hide() {
      this.visible = false;
      if (this.svg) {
        this.svg.hide();
      }
    }

    draw(anchor) {
      // redraw handles if word or link was moved
      let h = this.handles.find(h => (anchor === h.anchor));
      if (h) {
        h.x = anchor.cx + 8 * h.offset;
        h.y = this.top ? anchor.absoluteY : anchor.absoluteDescent;
      }

      if (!this.visible) { return; }

      // redraw line if it exists
      if (this.line) {
        let width = this.mainSVG.width();
        let d = '';

        // draw a polyline between the trigger and each of its arguments
        if (this.trigger) {
          let y = this.getY(this.handles[1]);
          let rowCrossed = false;

          for (let i = 0, il = this.arguments.length; i < il; ++i) {
            let leftOfTrigger = this.arguments[i].anchor.idx < this.trigger.idx;
            let dx = leftOfTrigger ? 5 : -5;
            let textlen = leftOfTrigger ? this.svgTexts[i].length() : -this.svgTexts[i].length();

            let handle1 = this.handles[i + 1];

            // draw a line from the prev arrow segment
            if (i > 0) {
              // check if crossing over a row
              if (rowCrossed) {
                rowCrossed = false;
                d += 'L' + [width, y] + 'M0,';
                y = this.getY(handle1);
                d += y;
              }
              if (leftOfTrigger) {
                d += 'L' + [handle1.x + dx, y];
              }
              else {
                d += 'L' + [handle1.x + dx + textlen, y];
              }
            }
            else if (!leftOfTrigger) {
              // start drawing from the trigger
              y = this.getY(this.handles[0]);
              d += 'M' + [this.handles[0].x, this.handles[0].y]
                + 'C' + [this.handles[0].x, y, this.handles[0].x, y, this.handles[0].x - dx, y];

              // check if crossing over a row
              if (this.handles[0].anchor.row.idx < this.handles[1].anchor.row.idx) {
                d += 'L' + [width, y] + 'M0,';
                y = this.getY(this.handles[1]);
                d += y;
              }
              d += 'L' + [this.handles[1].x + dx + textlen, y];
            }

            // draw the text svg
            this.svgTexts[i]
              .x(handle1.x + dx + textlen / 2)
              .y(y - 10);

            // draw an arrow at the handle
            const s = 4;
            d += this.arrowhead(handle1);

            let handlePrecedesTrigger = leftOfTrigger && (i + 2 > il || this.arguments[i + 1].anchor.idx >= this.trigger.idx);

            // check if crossing over a row
            rowCrossed = (handlePrecedesTrigger && this.handles[0].anchor.row.idx != handle1.anchor.row.idx) || (!handlePrecedesTrigger && i + 1 < il && this.handles[i + 2].anchor.row.idx != handle1.anchor.row.idx);

            // draw an arrow segment coming from each argument
            if (handlePrecedesTrigger && rowCrossed) {
              // if row is crossed
              let tempY = this.getY(handle1);
              y = this.getY(this.handles[0]);

              d += 'M' + [handle1.x, handle1.y]
                + 'C' + [handle1.x, tempY, handle1.x, tempY, handle1.x + dx, tempY]
                + 'm' + [textlen, 0]
                + 'L' + [width, tempY]
                + 'M' + [0,y];
              rowCrossed = false;

              this.svgTexts[i].y(tempY - 10);
            }
            else {
              d += 'M' + [handle1.x, handle1.y]
                + 'C' + [handle1.x, y, handle1.x, y, handle1.x + dx, y];
              if (leftOfTrigger) {
                d += 'm' + [textlen, 0];
              }
            }

            if (handlePrecedesTrigger) {
              // draw trigger to the right of the arrow segment
              d += 'L' + [this.handles[0].x - dx, y]
                + 'c' + [dx, 0, dx, 0, dx, this.handles[0].y - y];
              if (i + 1 < il) {
                rowCrossed = this.handles[i + 2].anchor.row.idx != this.handles[0].anchor.row.idx;
                d += 'C' + [this.handles[0].x, y, this.handles[0].x, y, this.handles[0].x + dx, y];
              }
            }
          }
        }
        else if (this.reltype) {

          // draw lines between a non-trigger relationship
          let y = this.getY(this.handles[0]);
          let endHandle = this.handles[this.handles.length - 1];
          let textlen = this.svgTexts[0].length();
          let avg;

          if (this.handles[0].anchor.row.idx === endHandle.anchor.row.idx) {
            avg = this.arguments.reduce((acc, a) => acc + a.anchor.cx, 0) / this.arguments.length;
            d = 'M' + [this.handles[0].x, this.handles[0].y]
              + 'C' + [this.handles[0].x, y, this.handles[0].x, y, this.handles[0].x + 5, y]
              + 'L' + [avg - textlen / 2, y]
              + 'm' + [textlen, 0]
              + 'L' + [endHandle.x - 5, y]
              + 'C' + [endHandle.x, y, endHandle.x, y, endHandle.x, endHandle.y]
              + this.arrowhead(this.handles[0])
              + this.arrowhead(endHandle);
          }
          else {
            avg = (this.handles[0].x + width) / 2;
            d = 'M' + [this.handles[0].x, this.handles[0].y]
              + 'C' + [this.handles[0].x, y, this.handles[0].x, y, this.handles[0].x + 5, y]
              + 'L' + [avg - textlen / 2, y]
              + 'm' + [textlen, 0]
              + 'L' + [width, y];

            let tempY = this.getY(endHandle);
            d += 'M0,' + tempY
              + 'L' + [endHandle.x - 5, tempY]
              + 'C' + [endHandle.x, tempY, endHandle.x, tempY, endHandle.x, endHandle.y]
              + this.arrowhead(this.handles[0])
              + this.arrowhead(endHandle);
          }
          this.svgTexts[0].x(avg)
            .y(y - 10);

        }
        this.line.plot(d);
      }

      this.links.forEach(l => l.draw(this));
    }

    // helper function to calculate line-height in draw()
    getY(handle) {
      let r = handle.anchor.row;
      return this.top ?
          r.rh + r.ry - 45 - 15 * this.slot
        : r.rh + r.ry + 25 - 15 * this.slot;
    }

    // helper function to return a path string for an arrowhead
    arrowhead(handle) {
      const s = 4;
      return this.top ?
          'M' + [handle.x - s, handle.y - s] + 'l' + [s,s * 1.5] + 'l' + [s,-s * 1.5] :
          'M' + [handle.x - s, handle.y + s] + 'l' + [s, -s * 1.5] + 'l' + [s, s * 1.5];
    }

    remove() {
      this.svg.remove();

      let self = this;
      // remove reference to a link
      function detachLink(anchor) {
        let i = anchor.links.indexOf(self);
        if (i > -1) {
          anchor.links.splice(i, 1);
        }
      };

      // remove references to link from all anchors
      if (this.trigger) { detachLink(this.trigger); }
      this.arguments.forEach(arg => detachLink(arg.anchor));
    }

    recalculateSlots(words) {
      // reorganize slots
      let self = this;
      let ep = this.endpoints;
      let wordArray = words.slice(this.endpoints[0].idx, this.endpoints[1].idx + 1);

      // recursively increase the slots of l
      function incrementSlot(l, top) {
        l.slot += top ? 1 : -1;
        l.links.forEach(incrementSlot);
      }

      // recursively check for collisions
      function checkCollision(l) {
        if (l !== self && l.slot === self.slot) {
          if (l.endpoints[0] <= ep[0] && l.endpoints[1] >= ep[0]) {
            incrementSlot(l, self.top);
            l.recalculateSlots(words);
          }
          else if (l.endpoints[0] >= ep[0] &&  l.endpoints[0] <= ep[1]) {
            // TODO: properly handle slots of self
            incrementSlot(self, self.top);
          }
          l.links.forEach(checkCollision);
        }
      }

      wordArray.forEach(w => {
        // get relevant links
        w.links.forEach(checkCollision);
      });

    }

    getEndpoints() {
      let minWord = null;
      let maxWord = null;

      if (this.trigger) {
        minWord = maxWord = this.trigger;
      }

      this.arguments.forEach(arg => {
        if (arg.anchor instanceof Link) {
          let endpts = arg.anchor.getEndpoints();
          if (!minWord || minWord.idx > endpts[0].idx) {
            minWord = endpts[0];
          }
          if (!maxWord || maxWord.idx < endpts[1].idx) {
            maxWord = endpts[1];
          }
        }
        else { // word or wordcluster
          if (!minWord || minWord.idx > arg.anchor.idx) {
            minWord = arg.anchor;
          }
          if (!maxWord || maxWord.idx < arg.anchor.idx) {
            maxWord = arg.anchor;
          }
        }
      });
      return [minWord, maxWord];
    }

    get rootWord() {
      if (this.trigger) { return this.trigger; }
      if (this.arguments[0].anchor instanceof Word) {
        return this.arguments[0].anchor;
      }
      return this.arguments[0].anchor.rootWord;
    }

    get idx() {
      return this.rootWord.idx;
    }

    get row() {
      return this.rootWord.row;
    }

    get cx() {
      return this.rootWord.cx;
    }

    get absoluteY() {
      return this.rootWord.row.rh + this.rootWord.row.ry - 45 - 15 * this.slot;
    }

    get val() {
      return this.reltype || this.trigger.val;
    }
}
