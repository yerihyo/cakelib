import GroupbyTool from '../groupby_tool';
import DictTool from '../../collection/dict/dict_tool'
import ArrayTool from '../../collection/array/array_tool';

test('GroupbyTool.dict_groupby_1step', () => {
    const l_in =[11,22,33,44,55,61,72,83,94]
    
    const hyp = GroupbyTool.dict_groupby_1step(l_in, x=>x%10)
    const ref = {1:[11,61],2:[22,72],3:[33,83],4:[44,94], 5:[55]}

    expect(hyp).toStrictEqual(ref);
});


test('GroupbyTool.array2dict_count', () => {
    const l_in = [11, 22, 33, 44, 55, 61, 72, 83, 94]

    const hyp = GroupbyTool.array2dict_count(l_in, x => x % 10)
    const ref = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1 }

    expect(hyp).toStrictEqual(ref);
});


test('GroupbyTool.dict_groupby2groups_list_by_count', () => {
    const l_in = [11, 22, 33, 44, 55, 61, 72, 83, 94]

    const hyp = GroupbyTool.dict_groupby2groups_list_by_count(GroupbyTool.dict_groupby_1step(l_in, x=> x% 10));
    // console.log(hyp);

    // const hyp = GroupbyTool.array2count_item_list(l_in, x => x % 10)
    // 개수 **오름차순** 이다 (groupby_tool.ts:338 `counts_sorted`) — 1개짜리 그룹이 먼저 온다.
    const ref = [
        [[55]],
        [[11,61], [22,72], [33,83], [44,94]],
    ];

    expect(hyp).toStrictEqual(ref);
});

test('GroupbyTool.dict_gbtree', () => {
    const l_in =[11,22,33,44,55,61,73,82,94]
    
    const hyp = GroupbyTool.dict_gbtree(l_in, [x=>x%10, x => Math.floor(x/10)%2]);
    const ref = {1:{1:[11],0:[61]},2:{0:[22,82]},3:{1:[33,73]},4:{0:[44], 1:[94]}, 5:{1:[55]}};

    expect(hyp).toStrictEqual(ref);
});

test('GroupbyTool.groupby_global_1step', () => {
    const l_in = [
        { a: 1, b: { key: 'two', c: 2 }, },
        { a: 2, b: { key: 'three', c: 3 }, },
        { a: 3, b: { key: 'two', c: 2 }, },
    ];
    
    const hyp = GroupbyTool.groupby_global_1step(
        l_in,
        // `items2leaf` 는 소스에서 주석 처리됐다(groupby_tool.ts:210) — 넘겨도 무시되고 원본 item 이 그대로 나온다.
        {
            item2parent: x => x.b,
            parent2key: b => b.key,
        }
    );
    const ref = [
        [{ key: 'two', c: 2 }, [l_in[0], l_in[2]]],
        [{ key: 'three', c: 3, }, [l_in[1]]],
    ];

    expect(hyp).toStrictEqual(ref);
});

test('GroupbyTool.array2firstK_minimaxindexes_list', () => {
    const l = [1,2,3,4,5,4,3,2,1,2,3,2,1];

    const hyp1 = GroupbyTool.array2firstK_minimaxindexes_list(l, 3);
    expect(hyp1).toStrictEqual(
        [
            [[0,8,12]],
            [[4], [3,5]],
        ]
    );

    const hyp2 = GroupbyTool.array2firstK_minimaxindexes_list(l, 4);
    expect(hyp2).toStrictEqual(
        [
            [[0,8,12], [1,7,9,11]],
            [[4], [3,5], [2,6,10,]],
        ]
    )
    expect(ArrayTool.arrays2flatten_tailfirst(hyp2[0])).toStrictEqual([12,8,0,11,9,7,1]);


    const hyp3 = GroupbyTool.array2firstK_maxindexes_list(l, 4);
    expect(hyp3).toStrictEqual([[4], [3,5], [2,6,10,]],)
});

test('GroupbyTool.dict_groupby2reversed', () => {
    const h_in = { dev: ['dev', 'development'], prod: ['prod', 'production'] };

    const h_out = GroupbyTool.dict_groupby2reversed(h_in);
    expect(h_out).toStrictEqual(
        { dev: 'dev', development:'dev', production:'prod', prod:'prod'}
    );
});
