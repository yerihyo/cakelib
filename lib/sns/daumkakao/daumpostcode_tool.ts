import { Address as Daummainaddress } from 'react-daum-postcode/lib/loadPostcode'
import DateTool from '../../date/date_tool'

export default class DaumpostcodeTool {
  static daumaddress2str_addresshead = (mainaddress: Daummainaddress): string => {
    const cls = DaumpostcodeTool
    const callname = `DaumpostcodeTool.address2str_nozipcode @ ${DateTool.time2iso(
      new Date(),
    )}`

    // console.log({ callname, mainaddress })

    if (mainaddress.addressType === 'R') {
      let extraAddress = ''
      if (mainaddress.bname !== '') {
        extraAddress += mainaddress.bname
      }
      if (mainaddress.buildingName !== '') {
        extraAddress +=
          extraAddress !== ''
            ? `, ${mainaddress.buildingName}`
            : mainaddress.buildingName
      }
      return [
        mainaddress.address,
        ...(extraAddress !== '' ? [`(${extraAddress})`] : []),
      ].join(' ');
    }
    else {
      return mainaddress.address;
    }

    // console.log({daumaddress, fullAddress}); // e.g. '서울 성동구 왕십리로2길 20 (성수동1가)'
  }

  // static main_detail2joined = (
  //   mainaddress: Daummainaddress,
  //   addressdetail: string,
  // ): string => {
  //   const cls = DaumpostcodeTool
  //   const callname = `DaumpostcodeTool.address_detail2str @ ${DateTool.time2iso(new Date())}`

  //   return [
  //     cls.daumaddress2str_addresshead(mainaddress),
  //     addressdetail,
  //     mainaddress.zonecode,
  //   ]
  //     .filter(Boolean)
  //     .join(' ')
  // }

  static str2imploded(str_in: string) {
    if (!str_in) {
      return undefined
    }

    const str_clean = str_in.trim()
    const zipcode = str_clean.match(/(\d{5}$)|(\d{5}-\d{4}$)/g)?.[0]

    const str_address = str_clean
      .trim()
      .slice(0, str_clean.length - (zipcode?.length ?? 0))
    return {address:str_address, zipcode}
  }

  // static str2is_island(str_in:string){
  //   const cls = DaumpostcodeTool;
  //   if(!str_in){ return undefined; }

  //   const [roadaddress, zipcode] = cls.str2imploded(str_in);
  //   return AddressTool.zipcode_roadaddress2is_island(zipcode, roadaddress);
  // }
}
// const Postcode = () => {

// };
