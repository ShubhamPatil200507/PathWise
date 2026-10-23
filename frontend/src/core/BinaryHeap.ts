/**
 * High-performance Binary Min-Heap Priority Queue.
 * Implemented from scratch without third-party pathfinding libraries.
 * Supports primary priority and tie-breaking secondary priority (e.g., lower h(n) in A*).
 */
export interface HeapNode<T> {
  item: T;
  priority: number;
  secondaryPriority?: number;
}

export class BinaryHeap<T> {
  private heap: HeapNode<T>[] = [];

  constructor() {}

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public clear(): void {
    this.heap = [];
  }

  public peek(): HeapNode<T> | undefined {
    return this.heap[0];
  }

  public push(item: T, priority: number, secondaryPriority: number = 0): void {
    const node: HeapNode<T> = { item, priority, secondaryPriority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): HeapNode<T> | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  private compare(a: HeapNode<T>, b: HeapNode<T>): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    const aSec = a.secondaryPriority ?? 0;
    const bSec = b.secondaryPriority ?? 0;
    return aSec - bSec;
  }

  private bubbleUp(index: number): void {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (this.compare(element, parent) >= 0) break;
      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    const element = this.heap[index];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;

      if (leftChildIndex < length) {
        if (this.compare(this.heap[leftChildIndex], element) < 0) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const compareTarget = swapIndex === null ? element : this.heap[leftChildIndex];
        if (this.compare(this.heap[rightChildIndex], compareTarget) < 0) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = element;
      index = swapIndex;
    }
  }
}
