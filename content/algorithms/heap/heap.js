var Heap = function (array) {
    this.data = new DS.Array(array).represent_as('array_tree');
    this.length = this.data.length;

    if (array != undefined) {
        for (var i = Math.floor(this.length / 2); i >= 0; --i) {
            this._heapify(i);
        }
    }
}

Heap.prototype.find_max = function() {
    return this.data[0];
}

Heap.prototype.delete_root = function() {
    if (this.length > 0) {
        this.data[0] = this.data[this.length - 1];
        this.data.drop_last();
        this.length -= 1;
        this._heapify(0);
    }
}

Heap.prototype.insert = function(key) {
    this.data.push(key);
    var index = this.length;
    this.length += 1;

    while (index > 0) {
        var parent = Math.floor((index - 1) / 2);
        if (this.data[parent] < key) {
            this.data.swap(parent, index);
            index = parent;
        } else {
            break;
        }
    }
}

Heap.prototype._heapify = function(i) {
    while (true) {
        var left = 2 * i + 1;
        var right = 2 * i + 2;
        var largest = i;

        if (left < this.length && this.data[left] > this.data[largest]) {
            largest = left;
        }
        if (right < this.length && this.data[right] > this.data[largest]) {
            largest = right;
        }
        if (largest != i) {
            this.data.swap(largest, i);
            i = largest;
        } else {
            break;
        }
    }
}

var heap = new Heap();
for (var i = 0; i < 10; ++i) {
    heap.insert(Math.floor(Math.random() * 20));
}
for (var i = 0; i < 3; ++i) {
    console.log("max=" + heap.find_max());
    heap.delete_root();
}
