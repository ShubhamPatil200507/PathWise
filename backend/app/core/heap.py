from typing import Generic, TypeVar, List, Optional, Tuple

T = TypeVar('T')

class BinaryHeap(Generic[T]):
    """
    Academically rigorous Min-Binary-Heap Priority Queue.
    Implemented from scratch without relying on heapq or external libraries.
    """
    def __init__(self):
        # elements store: (priority, secondary_priority, item)
        self.heap: List[Tuple[float, float, T]] = []

    def __len__(self) -> int:
        return len(self.heap)

    def is_empty(self) -> bool:
        return len(self.heap) == 0

    def clear(self) -> None:
        self.heap = []

    def peek(self) -> Optional[Tuple[float, float, T]]:
        return self.heap[0] if self.heap else None

    def push(self, item: T, priority: float, secondary_priority: float = 0.0) -> None:
        node = (priority, secondary_priority, item)
        self.heap.append(node)
        self._bubble_up(len(self.heap) - 1)

    def pop(self) -> Optional[Tuple[float, float, T]]:
        if not self.heap:
            return None
        top = self.heap[0]
        bottom = self.heap.pop()
        if self.heap:
            self.heap[0] = bottom
            self._sink_down(0)
        return top

    def _compare(self, a: Tuple[float, float, T], b: Tuple[float, float, T]) -> int:
        if a[0] != b[0]:
            return -1 if a[0] < b[0] else 1
        if a[1] != b[1]:
            return -1 if a[1] < b[1] else 1
        return 0

    def _bubble_up(self, index: int) -> None:
        element = self.heap[index]
        while index > 0:
            parent_idx = (index - 1) // 2
            parent = self.heap[parent_idx]
            if self._compare(element, parent) >= 0:
                break
            self.heap[index] = parent
            self.heap[parent_idx] = element
            index = parent_idx

    def _sink_down(self, index: int) -> None:
        length = len(self.heap)
        element = self.heap[index]

        while True:
            left_idx = 2 * index + 1
            right_idx = 2 * index + 2
            swap_idx = None

            if left_idx < length:
                if self._compare(self.heap[left_idx], element) < 0:
                    swap_idx = left_idx

            if right_idx < length:
                target = element if swap_idx is None else self.heap[left_idx]
                if self._compare(self.heap[right_idx], target) < 0:
                    swap_idx = right_idx

            if swap_idx is None:
                break
            self.heap[index] = self.heap[swap_idx]
            self.heap[swap_idx] = element
            index = swap_idx
