export default class Queue<T> {
    elements: T[];
    headindex: number;
    tailindex: number;
    size: number;
  
    constructor() {
      this.elements = [] as T[];
      this.headindex = 0;
      this.tailindex = 0;
    }
    enqueue(element) {
      const is_overflow = this.size !== undefined && this.length >= this.size;
      if (is_overflow) { throw new Error("Queue full"); }
  
      this.elements[this.tailindex] = element;
      this.tailindex++;
    }
    dequeue() {
      if(this.isEmpty){ throw new Error("Queue empty"); }
  
      const item = this.elements[this.headindex];
      delete this.elements[this.headindex];
      this.headindex++;
      return item;
    }
    peek() {
      return this.elements[this.headindex];
    }
    get length() {
      return this.tailindex - this.headindex;
    }
    get isEmpty() {
      return this.length === 0;
    }
  
    values():T[]{
  
      if(this.isEmpty){ return []; }
  
      // console.log({
      //   elements:this.elements,
      // });
  
      return this.elements.slice(this.headindex, this.tailindex);
    }
  }
  