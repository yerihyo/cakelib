import lodash from 'lodash';
import GraftingTool from '../grafting_tool';
import CakeaholicPhonenumber from '../../../../../../singleton/data/cakeaholic_phonenumber'

test('GraftingTool.action2grafter', () => {
  const order1 = {
    "events" : [
      {
          "operation_key" : "PAYMENT",
          "scope" : {
              "level" : "ORDERWISE"
          }
      },
      {
          "operation_key" : "ORDER_CONFIRM",
          "scope" : {
              "level" : "ORDERWISE"
          }
      },
    ]
  }

  expect(
    GraftingTool.tree2grafted(order1, ['events','scope'], GraftingTool.action2leafducer('a'))
  ).toStrictEqual({
    "events" : [
      {
          "operation_key" : "PAYMENT",
          "scope" : 'a'
      },
      {
          "operation_key" : "ORDER_CONFIRM",
          "scope" : 'a',
      },
    ]
  });

  expect(
    GraftingTool.tree2grafted(order1, ['events', 'scope', 'level'], GraftingTool.action2leafducer('ORDERWISE'))
  ).toBe(order1);

  expect(
    GraftingTool.tree2grafted(order1, ['events', 'scope', 'level'], GraftingTool.leafducer_delete())
  ).toStrictEqual({
    "events" : [
      {
          "operation_key" : "PAYMENT",
      },
      {
          "operation_key" : "ORDER_CONFIRM",
      },
    ]
  });

  expect(
    GraftingTool.tree2grafted(order1, ['events', 'qwer', 'asdf','zxcv'], GraftingTool.action2leafducer('ORDERWISE'))
  ).toBe(order1);

  const order2 = {
    "events_list" : [
      [
        {
          
            "operation_key" : "PAYMENT",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
        {
            "operation_key" : "PAYMENT",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
      ],
      [
        {
            "operation_key" : "ORDER_CONFIRM",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
        {
            "operation_key" : "ORDER_CONFIRM",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
      ]
    ]
  }
  expect(
    GraftingTool.tree2grafted(order2, ['events_list','scope', 'level'], GraftingTool.action2leafducer('ORDERWISE'))
  ).toBe(order2);

  expect(
    GraftingTool.tree2grafted(order2, ['events_list', 'operation_key',], GraftingTool.action2leafducer(s => s == 'PAYMENT' ? 'PAYMENT2' : s))
  ).toStrictEqual({
    "events_list" : [
      [
        {
          
            "operation_key" : "PAYMENT2",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
        {
            "operation_key" : "PAYMENT2",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
      ],
      [
        {
            "operation_key" : "ORDER_CONFIRM",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
        {
            "operation_key" : "ORDER_CONFIRM",
            "scope" : {
                "level" : "ORDERWISE"
            }
        },
      ]
    ]
  });

  const order3 = {
    "brand_key" : "nIizUPQSY7ShRHcXPJlZZ",
    "cashreceipt" : {
        "identification_number" : "0102736382",
        "selfissue" : true
    },
    "orderer" : {
        "email" : "yerihyo@gmail.com",
        "name" : "강문영",
        "phonenumber" : "010-2736-3820"
    },
    "recepient" : {
        "identical_to_orderer" : false,
        "name" : "테스터",
        "phonenumber" : "01027363820"
    },
  }
  expect(
    lodash.flow(
      // o => GraftingTool.tree2grafted(o, ['extra.cashreceipt.data.number'], GraftingTool.action2leafducer(CakeaholicPhonenumber.x2e164)),
      o => GraftingTool.tree2grafted(o, ['orderer','phonenumber'], GraftingTool.action2leafducer(CakeaholicPhonenumber.x2e164)),
      o => GraftingTool.tree2grafted(o, ['recepient','phonenumber'], GraftingTool.action2leafducer(CakeaholicPhonenumber.x2e164)),
    )(order3)
  ).toStrictEqual({
    "brand_key" : "nIizUPQSY7ShRHcXPJlZZ",
    "cashreceipt" : {
        "identification_number" : "0102736382",
        "selfissue" : true
    },
    "orderer" : {
        "email" : "yerihyo@gmail.com",
        "name" : "강문영",
        "phonenumber" : "+821027363820"
    },
    "recepient" : {
        "identical_to_orderer" : false,
        "name" : "테스터",
        "phonenumber" : "+821027363820"
    },
  })


  const giftcard1 = {
    "owner" : {
        "phonenumber" : "010-000-1234"
    },
    "notifications" : [
        {
            "key" : "nAM97tSE9wzglJAkwj9Tp",
            "recepient_name" : "강문영",
            "phonenumber" : "010-345-1234"
        }
    ]
  }
  expect(
    lodash.flow(
      c => GraftingTool.tree2grafted(c, ['owner','phonenumber'], GraftingTool.action2leafducer(CakeaholicPhonenumber.x2e164)),
      c => GraftingTool.tree2grafted(c, ['notifications','phonenumber'], GraftingTool.action2leafducer(CakeaholicPhonenumber.x2e164)),
    )(giftcard1)
  ).toStrictEqual({
    "owner" : {
        "phonenumber" : "+82100001234"
    },
    "notifications" : [
        {
            "key" : "nAM97tSE9wzglJAkwj9Tp",
            "recepient_name" : "강문영",
            "phonenumber" : "+82103451234"
        }
    ]
  })
});


// 테스트 코드 시작
describe('GraftingTool Potential Errors Proof', () => {
  // 1. 🚨 오류 1 증명: node2is_worthy_default의 잘못된 사용 (원시 값 예외 발생)

  test('[Error 1 Proof] PINPOINT Trim should NOT throw on primitive value update', () => {
    // 현재 node2is_worthy_default는 원시 값에서 Error를 던지는 상태라고 가정합니다.
    const initialTree = { a: { b: 'old_value' } };

    // leafducer: 값을 'new_value'로 업데이트 (원시 값)
    const leafducer = GraftingTool.action2leafducer('new_value');

    // PINPOINT 경로 ['a', 'b']에서 'b'의 값('new_value')에 대해 node2is_worthy가 호출됩니다.
    // 이 때 'new_value'는 원시 값이므로 오류를 발생시켜야 합니다.

    // 이 테스트는 현재 구현(오류 상태)에서는 예외가 발생해야 합니다.
    expect(GraftingTool.tree2grafted(initialTree, ['a', 'b'], leafducer)).toStrictEqual({ a: { b: 'new_value' } }); 
    // 기대되는 실패: 'new_value' (string)이 node2is_worthy_default에 들어가 Invalid type Error를 발생시킵니다.
    
    // 이 테스트를 통과시키려면 node2is_worthy_default가 원시 값에 대해 true를 반환해야 합니다.
  });

  // 2. 🚨 오류 3 증명: DictTool.splice 로직의 불명확성
  // 현재 코드는 ArrayTool.splice와 비슷한 Custom DictTool.splice를 가정합니다.
  // 이 테스트는 DictTool.splice의 동작 불확실성이나 오류 가능성을 시사합니다.
  
  test('[Error 3 Proof] DictTool.splice should correctly delete and update PINPOINT keys', () => {
    const initialTree = { a: { key1: 10, key2: 20 } };

    // Case 1: Delete (worthy: false)
    const deleteResult = GraftingTool.tree2grafted(initialTree, ['a', 'key2'], GraftingTool.leafducer_delete());
    
    // DictTool.splice2self (OOPLIKE) 또는 DictTool.splice (VOPLIKE)가 정확히 작동해야 합니다.
    expect(deleteResult).toStrictEqual({ a: { key1: 10 } });
    
    // Case 2: Update (worthy: true)
    const leafducer = GraftingTool.action2leafducer(v => v + 1, {
        // Reduced된 값이 (v+1=11) 원시값이므로, node2is_worthy_default는 오류를 던지게 되어 있습니다.
        // 테스트를 위해 임시로 node2is_worthy_default를 true 반환으로 오버라이드합니다.
        reduced2is_worthy: () => true 
    });
    
    const updateResult = GraftingTool.tree2grafted(initialTree, ['a', 'key1'], leafducer);

    // DictTool.splice 로직이 'key1'을 11로 정확히 업데이트해야 합니다.
    expect(updateResult).toStrictEqual({ a: { key1: 11, key2: 20 } });
    
    // 이 테스트들은 DictTool.splice/splice2self 함수가 가정된 시그니처와 동작을 정확히 따르는지 검증합니다.
    // 만약 이 유틸리티 함수 구현에 오류가 있다면 테스트는 실패합니다.
  });


  // 3. ⚠️ 설계 불일치 증명: action2leafducer의 BROADCAST 중복 처리
  
  test('[Design Discrepancy] action2leafducer should not BROADCAST recursive if called via grafter', () => {
    // action2leafducer는 tree2grafted(grafter)의 leafducer로 호출될 때,
    // tree2grafted가 이미 BROADCAST 처리를 했으므로, 재귀 BROADCAST를 하면 안됩니다.

    const initialTree = [{ key: 10 }, { key: 20 }];

    // GraftingTool.tree2grafted는 path.length=2이므로 grafter를 호출합니다.
    // grafter는 Array이고, traversality='BROADCAST'이므로, map을 돌며 leafducer(action2leafducer)를 호출합니다.

    // test action: 값에 100을 더하고, 호출 횟수를 세는 action
    let callCount = 0;
    const trackingAction = GraftingTool.action2leafducer(v => {
      callCount++;
      return v + 100;
    }, { traversality: 'BROADCAST' }); // action2leafducer에도 BROADCAST를 설정합니다.

    GraftingTool.tree2grafted(initialTree, [0, 'key'], trackingAction); 

    // grafter 호출 경로 (path: [0, 'key']):
    
    // callCount가 1이 되어야 합니다.
    expect(callCount).toBe(1);
    
    // 이 테스트는 현재 action2leafducer의 내부 BROADCAST 로직이 중복 호출을 유발함을 보여줍니다.
  });
});
