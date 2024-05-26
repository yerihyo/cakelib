import FormikTool from '../../../../lib/form/formik/formik_tool';

test('FormikTool.test_regex_phonenumber', async () => {
    /**
     * Documentation:
     * https://developer.payple.kr/integration/link-payment
     */

    expect(FormikTool.regex_phonenumber().test('01088870027')).toBe(true);
    // expect('01088870027'.match(FormikTool.regex_phonenumber())).toBe(true);
})
