assert = require('assert')
worker = require('../_tests/array.js')

Arr = worker.DS.Array

assert.array_equal = (arr1, arr2) ->
    assert.equal(arr1.length, arr2.length, "comparing arrays with two diffent sizes")
    for v, i in arr1
        assert.equal(v, arr2[i], "(a[#{i}] === #{v}) !== (#{arr2[i]} === b[#{i}])")

describe 'array', ->
    it 'should initialize with nothing', ->
        arr = new Arr()
        assert.equal(arr.length, 0)
        assert.equal(arr.keys().length, 0)

    it 'should initialize with a built-in array', ->
        arr = new Arr([4,5,6])
        assert.equal(arr.length, 3)
        assert.array_equal(arr.keys(), [0,1,2])
        for v, i in [4,5,6]
            assert.equal(arr[i], v)

    it 'should push in the last position', ->
        arr = new Arr()
        assert.equal(arr.length, 0)
        arr.push(3)
        assert.equal(arr.length, 1)
        assert.equal(arr[0], 3)
        arr.push(4)
        assert.equal(arr.length, 2)
        assert.array_equal([3,4], arr)

    it 'should validate bounds', ->
        arr = new Arr([1,2,3])
        assert.ok(arr.valid_bounds(0))
        assert.ok(arr.valid_bounds(1))
        assert.ok(arr.valid_bounds(2))
        assert.ok(not arr.valid_bounds(3))

    it 'should drop any element', ->
        arr = new Arr([4,5,6,7])
        assert.equal(arr.length, 4)
        arr.drop(0)
        assert.equal(arr.length, 3)
        assert.array_equal([5,6,7], arr)
        arr.drop(1)
        assert.equal(arr.length, 2)
        assert.array_equal([5,7], arr)
        arr.drop(1)
        assert.equal(arr.length, 1)
        assert.array_equal([5], arr)

    it 'should drpo the last element', ->
        arr = new Arr([4,5,6,7])
        assert.equal(arr.length, 4)
        arr.drop_last()
        assert.equal(arr.length, 3)
        assert.array_equal([4,5,6], arr)
        arr.drop_last()
        assert.equal(arr.length, 2)
        assert.array_equal([4,5], arr)
        arr.drop_last()
        assert.equal(arr.length, 1)
        assert.array_equal([4], arr)
        arr.drop_last()
        assert.equal(arr.length, 0)

    it 'should swap', ->
        arr = new Arr([4,5,6,7])
        assert.array_equal([4,5,6,7], arr)
        arr.swap(0,3)
        assert.array_equal([7,5,6,4], arr)
        arr.swap(2,1)
        assert.array_equal([7,6,5,4], arr)
