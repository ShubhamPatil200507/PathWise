#pragma once

#include <vector>
#include <stdexcept>
#include <utility>

namespace pathwise {

template <typename T>
struct HeapNode {
    T item;
    double priority;
    double secondaryPriority;

    HeapNode(T it, double prio, double secPrio = 0.0)
        : item(std::move(it)), priority(prio), secondaryPriority(secPrio) {}
};

template <typename T>
class BinaryHeap {
private:
    std::vector<HeapNode<T>> heap;

    int compare(const HeapNode<T>& a, const HeapNode<T>& b) const {
        if (a.priority < b.priority) return -1;
        if (a.priority > b.priority) return 1;
        if (a.secondaryPriority < b.secondaryPriority) return -1;
        if (a.secondaryPriority > b.secondaryPriority) return 1;
        return 0;
    }

    void bubbleUp(std::size_t index) {
        while (index > 0) {
            std::size_t parentIdx = (index - 1) / 2;
            if (compare(heap[index], heap[parentIdx]) >= 0) break;
            std::swap(heap[index], heap[parentIdx]);
            index = parentIdx;
        }
    }

    void sinkDown(std::size_t index) {
        std::size_t length = heap.size();
        while (true) {
            std::size_t leftChild = 2 * index + 1;
            std::size_t rightChild = 2 * index + 2;
            std::size_t swapIdx = index;

            if (leftChild < length && compare(heap[leftChild], heap[swapIdx]) < 0) {
                swapIdx = leftChild;
            }

            if (rightChild < length && compare(heap[rightChild], heap[swapIdx]) < 0) {
                swapIdx = rightChild;
            }

            if (swapIdx == index) break;
            std::swap(heap[index], heap[swapIdx]);
            index = swapIdx;
        }
    }

public:
    BinaryHeap() = default;

    std::size_t size() const {
        return heap.size();
    }

    bool isEmpty() const {
        return heap.empty();
    }

    void clear() {
        heap.clear();
    }

    void push(const T& item, double priority, double secondaryPriority = 0.0) {
        heap.emplace_back(item, priority, secondaryPriority);
        bubbleUp(heap.size() - 1);
    }

    const HeapNode<T>& peek() const {
        if (heap.empty()) {
            throw std::runtime_error("BinaryHeap is empty!");
        }
        return heap[0];
    }

    HeapNode<T> pop() {
        if (heap.empty()) {
            throw std::runtime_error("BinaryHeap underflow!");
        }
        HeapNode<T> top = heap[0];
        HeapNode<T> bottom = heap.back();
        heap.pop_back();
        if (!heap.empty()) {
            heap[0] = bottom;
            sinkDown(0);
        }
        return top;
    }
};

} // namespace pathwise
