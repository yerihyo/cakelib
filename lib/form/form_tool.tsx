import React from 'react';
import { Form } from "semantic-ui-react";
import ArrayTool from '../collection/array/array_tool';
import DateTool from "../date/date_tool";

export default class FormTool{
  
  static text2width(text:string, offset?:number){
    if(text == null){ return undefined; }

    const v = [...text].reduce((v,c) => v + ([...'(,)'].includes(c) ? 0.5 : 1.05), 0);
    return `${v + (offset ?? 0) + .5}ch`;
    // return (text.length + 0.5) + 'ch';
  }

  static GrowingInput = (props: {
    value?: string,
    // onChange?: (x:string) => void,
    [k: string]: any,  // https://stackoverflow.com/a/50288327/1902064
  }) => {
    const callname = `FormTool.GrowingInput @ ${DateTool.time2iso(new Date())}`;

    const {value, onChange, ...rest} = props;
    // const [text, setText] = React.useState<string>(text_in || '');

    // console.log({callname, event:'onLoad', text_in, text});
    // React.useEffect(() => setText(text_in || ''), [text_in]);

    return (<>
      <Form.Input 
        value={value}
        style={{ color: 'inherit', display: 'inline-block', width: FormTool.text2width(value), }}
        // onChange={e => {
        //   console.log({ callname, event:'onChange', 'e.target.value': e.target.value, })
        //   onChange(e.target.value);
        //   // onChange && onChange(e);
        // }}
        {...rest}
      />
    </>);
  };

  static GrowingInputOld = (props: {
    value?: string,
    [k: string]: any,  // https://stackoverflow.com/a/50288327/1902064
  }) => {
    const callname = `FormTool.GrowingInputOld @ ${DateTool.time2iso(new Date())}`;

    const {value:text_in, ...rest} = props;
    const [text, setText] = React.useState<string>(text_in || '');

    // console.log({callname, event:'onLoad', text_in, text});
    React.useEffect(() => setText(text_in || ''), [text_in]);

    return (<>
      <Form.Input 
        value={text}
        style={{ color: 'inherit', display: 'inline-block', width: FormTool.text2width(text), }}
        onChange={e => {
          // console.log({ callname, event:'onChange', 'e.target.value': e.target.value, })
          setText(''+e.target.value);
          // onChange && onChange(e);
        }}
        {...rest}
      />
    </>);
  };

  // static GrowingInputNew = (props:{
  //   value:number,
  //   onChange?: (v:number) => void,
  // }) => {
  //   const callname = `FormTool.GrowingInput @ ${DateTool.time2iso(new Date())}`;

  //   const {value:value_in, onChange,} = props;
  //   const [value, setValue] = React.useState<number>(value_in || 0);
  //   if(HookTool.value2changed(value_in, lodash.isEqual)){
  //     console.log({callname, value, value_in, 'stage':'value_in.onChange'});
  //     setValue(value_in);
  //   }

  //   if(HookTool.value2changed(value, lodash.isEqual) && onChange){
  //     console.log({callname, value, 'stage':'value.onChange'});
  //     onChange(value);
  //   }

  //   return <Input transparent placeholder='이름' value={NumberTool.num2str(value)}
  //     style={{ color: 'inherit', display: 'inline-block', width: CakeaholicFrame.text2width(NumberTool.num2str(value),), }}
  //     onChange={e => {
  //       console.log({callname, 'e.target.value':e.target.value,})
  //       setValue(+e.target.value);
  //     }}
  //     onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
  //       if (ArrayTool.in(e.key, ['Up', 'ArrowUp'])) {
  //         e.preventDefault();
  //         setValue(v => v + 1);
  //       }
  //       if (ArrayTool.in(e.key, ['Down', 'ArrowDown'])) {
  //         e.preventDefault();
  //         setValue(v => v - 1);
  //       }
  //     }}
  //   />;
  // };

  static downkeys():string[]{ return ['Down', 'ArrowDown']; }
  static upkeys():string[]{ return ['Up', 'ArrowUp']; }
  static enterkeys():string[]{ return ['Enter']; }
  static escapekeys():string[]{ return ['Escape']; }

  // static keyevent2is_composing(e: React.KeyboardEvent):boolean {
  //   return e.nativeEvent.isComposing;
  // }
  static keyevent2is_valid_enter(e: React.KeyboardEvent) {
    /**
     * refereneces
     * https://velog.io/@corinthionia/JS-keydown에서-한글-입력-시-마지막-음절이-중복-입력되는-경우-함수가-두-번-실행되는-경우
     * https://literate-t.tistory.com/390#comment13226212
     * https://doqtqu.tistory.com/344
     */

    return [
      ArrayTool.in(e.key, FormTool.enterkeys()),
      e.nativeEvent.isComposing === false,
    ].every(Boolean);
  }
  
  static setter2propdict_numberinput = (
    setter:React.Dispatch<React.SetStateAction<number>>,
    
    option?:{
      step?:number,
    }
  ) => {
    // const setter_clamped = HookTool.setter2clamped(setter, options);

    const step = option?.step ?? 1;
    const props_input = {
      onChange: (e:any) => { setter(+e.target.value); },
      onBlur: (e: React.FocusEvent<HTMLInputElement, Element>) => { setter(+e.target.value); },
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (ArrayTool.in(e.key, FormTool.downkeys())) { e.preventDefault(); setter(v => v - step); }
        if (ArrayTool.in(e.key, FormTool.upkeys())) { e.preventDefault(); setter(v => v + step); }
      },
      onKeyPress: (e: any) => { if (!/[0-9]/.test(e.key)) { e.preventDefault(); } },
    };

    // console.log({option, step});
    const props_minus = {
      onClick: (e:React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { e.preventDefault(); setter(v => v-step); },
    };

    const props_plus = {
      onClick: (e:React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { e.preventDefault(); setter(v => v+step); },
    };

    return {
      input:props_input,
      minus:props_minus,
      plus:props_plus,
    };
  }
}
