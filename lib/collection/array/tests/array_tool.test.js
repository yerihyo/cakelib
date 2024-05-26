import ArrayTool from '../array_tool';
import CmpTool from '../../../cmp/CmpTool';

test('ArrayTool.array2dict', () => {
    const l = [11,22,33,44,55];
    const hyp = ArrayTool.array2dict(l, x=>x%10);
    const ref = {1:11, 2:22, 3:33, 4:44, 5:55};
    expect(hyp).toStrictEqual(ref);

    expect(hyp).toStrictEqual({'1':11, '2':22, '3':33, '4':44, '5':55});
});

test('ArrayTool.array2dict.fail', () => {
    const l = [11,21,33,44,55];
    expect(() => ArrayTool.array2dict(l, x=>x%10)).toThrow(Error);
});


test('ArrayTool.array2duplicate_indexes', () => {
    const l = [1,2,3,2,1]
    
    expect(ArrayTool.array2duplicates(l))
    .toStrictEqual({1:[0,4], 2:[1,3]});

    expect(ArrayTool.array2duplicate_indexes(l))
    .toStrictEqual([0,1,3,4]);

});


test('ArrayTool.ll2zip', () => {
    const rows_01 = [[11,12,13],[21,22,23],[31,32,33]];
    const ref_01 = [[11,21,31],[12,22,32,],[13,23,33]];
    expect(ArrayTool.ll2zip(rows_01)).toStrictEqual(ref_01);
    expect(ArrayTool.zip(...rows_01)).toStrictEqual(ref_01);

    const rows_02 = [[11,12,13],[21],[31,32]];
    const ref_02 = [[11,21,31],[12,undefined,32,],[13,undefined,undefined]];
    expect(ArrayTool.ll2zip(rows_02)).toStrictEqual(ref_02);
    expect(ArrayTool.zip(...rows_02)).toStrictEqual(ref_02);


    const rows_03 = [[11,12,13],[21],[31,32]];
    const ref_03 = [[11,21,31],[12,32,],[13]];
    expect(ArrayTool.ll2zip(rows_03).map(ArrayTool.void_cleaned)).toStrictEqual(ref_03);
});


test('ArrayTool.splice', () => {
    expect(ArrayTool.splice([1,2,3], 1, 0, 4)).toStrictEqual([1,4,2,3]);
    expect(ArrayTool.splice([1,2,3], 1, 1, 4, 5)).toStrictEqual([1,4,5,3]);
    expect(ArrayTool.splice([1,2,3], 3, 0, 4, 5)).toStrictEqual([1,2,3,4,5]);
    expect(ArrayTool.splice([1,2,3], 2, 5, 4, 5)).toStrictEqual([1,2,4,5]);

    expect(ArrayTool.splice([1,2,3], 2, 5)).toStrictEqual([1,2,]);

    expect(ArrayTool.splice([1,2,3], 1)).toStrictEqual([1,]);
    expect(ArrayTool.splice([1,2,3], -2,)).toStrictEqual([1]);
    expect(ArrayTool.splice([1,2,3], -2,1)).toStrictEqual([1,3]);
    // expect(ArrayTool.splice([1,2,3], 3, 0, 4, 5)).toStrictEqual([1,2,3,4,5]);
});


test('ArrayTool.rotatingshift', () => {
    expect(ArrayTool.rotatingshift([1,2,3])).toStrictEqual([2,3,1]);
    expect(ArrayTool.rotatingshift([1])).toStrictEqual([1]);
    expect(ArrayTool.rotatingshift([])).toStrictEqual([]);
});

test('ArrayTool.rotatingunshift', () => {
    expect(ArrayTool.rotatingunshift([1,2,3])).toStrictEqual([3,1,2]);
    expect(ArrayTool.rotatingunshift([1])).toStrictEqual([1]);
    expect(ArrayTool.rotatingunshift([])).toStrictEqual([]);
});

test('ArrayTool.rotateL', () => {
    expect(ArrayTool.rotateL([1,2,3], 1)).toStrictEqual([2,3,1]);
    expect(ArrayTool.rotateL([1,2,3], 7)).toStrictEqual([2,3,1]);
    expect(ArrayTool.rotateL([1], 9)).toStrictEqual([1]);
    expect(ArrayTool.rotateL([], 9)).toStrictEqual([]);
});

test('ArrayTool.rotateR', () => {
    expect(ArrayTool.rotateR([1,2,3], 1)).toStrictEqual([3,1,2]);
    expect(ArrayTool.rotateR([1,2,3], 10)).toStrictEqual([3,1,2]);
    expect(ArrayTool.rotateR([1],9)).toStrictEqual([1]);
    expect(ArrayTool.rotateR([],9)).toStrictEqual([]);
});


test('ArrayTool.indexes2inverted', () => {
    expect(ArrayTool.indexes2inverted([2,0,1])).toStrictEqual([1,2,0]);
});

test('ArrayTool.rankindexes', () => {
    // https://numpy.org/doc/stable/reference/generated/numpy.argsort.html
    expect(ArrayTool.rankindexes([3,1,2])).toStrictEqual([2,0,1]); // not [1,2,0,]
});

test('ArrayTool.argssorted', () => {
    // https://numpy.org/doc/stable/reference/generated/numpy.argsort.html
    expect(ArrayTool.argssorted([3,1,2])).toStrictEqual([1,2,0]); // not [2,0,1]
    expect(ArrayTool.argssorted([3,2,1])).toStrictEqual([2,1,0]);
    expect(ArrayTool.argssorted([1,9,2])).toStrictEqual([0,2,1]);
    expect(ArrayTool.argssorted([1,9,2,3])).toStrictEqual([0,2,3,1]);
    const l = [
        74.0700081534955,  64.41072599354987, 1762.238331393798,  85.74594833951691,
      118.48612771579117, 13.121209716409284, 280.86729679691854, 262.42761175850063,

       56.69204077856639,  55.70694093382824, 563.9705217933996,  1.584962500721156,
      48.485384262299824,  197.2400904738346, 60.32769609916569,  47.25414240044011,
      
      192.49932720688952, 105.55631504072369, 2869.125988454116,  91.38961418200077,
       85.80355451385753,  24.40167119400126, 7.807354922057604, 144.43957251410976,

      144.63161369458547
    ];
    const x =  [
        11, 22,  5, 21, 15, 12,  9, 8,
        14,  1,  0,  3, 20, 19, 17, 4,
        23, 24, 16, 13,  7,  6, 10, 2,
        18
      ];
    expect(ArrayTool.argssorted(l)).toStrictEqual(x);
});


test('ArrayTool.dict_argssorted', () => {
    expect(ArrayTool.dict_argssorted([3,2,1])).toStrictEqual({3:2,2:1,1:0});

    const h = {
        '0QPTtK64ls_ypUHPAmOod': 74.0700081534955, // 0
        '6VRvEY0ISejzBh3R8XyUQ': 64.41072599354987,
        '6krDEfIz5sBw31nCi_Rbv': 1762.238331393798,
        '8wa6u0gA9JUxXXNrj_r-d': 85.74594833951691,
        '-XZylptCl991AdLy6rRtF': 118.48612771579117,
        '-mKJXA73TmiCUj08OnZrE': 13.121209716409284,
        '-q2kk9cReFk95aeFlZ54A': 280.86729679691854,
        'HnbbJzD1-U-xlJlIwqjtU': 262.42761175850063,
        'JolEvT99OcXu8GrD4IWd1': 56.69204077856639,
        'MwCASRWmDripmW0TW4qes': 55.70694093382824, 
        'SzNiFMA97V9PtlXCzKJsa': 563.9705217933996, // 10
        'V4ek96uZ_Mi7bBAkPAE4G': 1.584962500721156,
        'VEwvFYcEmIqT6l7aOm1eh': 48.485384262299824,
        'VSerp-ZvVECO4tBa4sGOC': 197.2400904738346,
        'YAs1MX8RiADOgi4NJfWAv': 60.32769609916569,
        'YUsTPJA5eG41paGWTkzgg': 47.25414240044011,
        'cVrkZ5mNk6VvIi9q9AD0G': 192.49932720688952,
        'daMat4OiR1KQmQsqZWN5g': 105.55631504072369,
        'hvYHCu9yFcB8YALREeGCb': 2869.125988454116, // 18
        'iMX3IBMOQblKMpCffaoUn': 91.38961418200077,
        'mqd5s_g4yhyvpEe5nGKVL': 85.80355451385753,
        't7DYRjrZ0gDk21fS2vR0o': 24.40167119400126,
        'x_GPnIUPpfPVF0slMHcK5': 7.807354922057604,
        'yC8XIFWQboBBpxPziG2F0': 144.43957251410976,
        'zPfyUpCHcPBkEuCl-xmqZ': 144.63161369458547,
    };
    const keys = Object.keys(h);
    // const values = keys.map(k => h[k]);

    const indexes2 = ArrayTool.argssorted(keys, CmpTool.numdict2f_cmp_desc(h),)
    // console.log({values, indexes2})
    expect(indexes2[0]).toStrictEqual(18);

    const h2 = ArrayTool.dict_argssorted(Object.keys(h), CmpTool.numdict2f_cmp_desc(h),)
    expect(h2['hvYHCu9yFcB8YALREeGCb']).toStrictEqual(0);

});
