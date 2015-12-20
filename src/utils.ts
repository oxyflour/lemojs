export class FakeHash {
    private keys = [ ]
    private vals = [ ]

    put(key: any, val: any) {
        var idx = this.keys.indexOf(key)
        if (idx < 0) {
            this.keys.push(key)
            this.vals.push(val)
        }
        else {
            this.vals[idx] = val
        }
        return val
    }

    get(key: any) {
        return this.vals[this.keys.indexOf(key)]
    }

    key(i: number = undefined) {
        return typeof i === 'number' ? this.keys[i] : this.keys.slice()
    }

    val(i: number = undefined) {
        return typeof i === 'number' ? this.vals[i] : this.vals.slice()
    }
}

export function debounce<T extends Function>(func: T, delay: number): T {
    var timeout = 0
    return function() {
        var that = this,
            args = arguments
        if (timeout)
            clearTimeout(timeout)
        timeout = setTimeout(function () {
            func.apply(that, args)
        }, delay)
    } as any
}
