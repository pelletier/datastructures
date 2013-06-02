var Heap = function (array) {
    this.data = (array != undefined) ? array : [];
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
        this.data = this.data.slice(0, -1);
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
            var tmp = this.data[parent];
            this.data[parent] = this.data[index];
            this.data[index] = tmp;
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
            var tmp = this.data[largest];
            this.data[largest] = this.data[i];
            this.data[i] = tmp;
            i = largest;
        } else {
            break;
        }
    }
}

var heap = new Heap([4,5,1,9]);
console.log("max=" + heap.find_max());
