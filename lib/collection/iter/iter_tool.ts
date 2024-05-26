
export default class IterTool{
    // https://stackoverflow.com/a/10284006
    static zip = <X=any>(...rows:X[][]):X[][] => [...rows[0]].map((_, j) => rows.map(row => row[j]));
    static* takewhile<X> (item2bool:(item:X) => boolean, items: Iterable<X>) : Iterable<X> {
        for (let item of items)
            if (item2bool(item))
                yield item;
            else
                break;
    }

    static count(iterable) {
        let i = 0;
        for (let x of iterable)
            i++;
        return i;
    }

    static index_first_false(iterable, ){
        return IterTool.count(Array.from(IterTool.takewhile(x => !!x, iterable)));
    }

    // static* iter2genr<X>(iterator: Iterator<X>): Iterable<X> {
    //     let result = iterator.next();
    //     // console.log({result});
    //     while (!result.done) {
    //         // throw new Error(`result.value':${result.value}`);
    //         // console.log({'result.value':result.value});
    //         yield (result.value as X)
    //         result = iterator.next();
    //     }
    // }

    static* map<X, V>(iterable: Iterable<X>, callback: (x: X) => V): Iterable<V> {
        if(iterable == null){ return undefined; }
        // https://stackoverflow.com/a/64862995
        for (let x of iterable) {
            yield callback(x);
        }
    }

    static* reversed<X>(array: X[]): Iterable<X> {
        const n = array.length;
        for(let i=n-1; i>=0; i--){
            yield array[i];
        }
    }

    static* filter<X>(iterable: Iterable<X>, is_valid: (x: X) => boolean): Iterable<X> {
        for (let x of iterable) {
            if (is_valid(x)) { yield x; }
        }
    }

    static first<X>(iterable: Iterable<X>,): X {
        for (let x of iterable) {
            return x
        }
    }
}
