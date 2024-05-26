import ArrayTool from "../collection/array/array_tool";

export default class FileTool {
  static dirname = (path: string): string => path?.substring(0, path?.lastIndexOf('/'));

  /**
   * https://stackoverflow.com/a/680982
   * @param filename 
   */
  static filename2extension = (filename:string):string => {
    const re = /(?:\.([^.]+))?$/;
    return re.exec(filename)[1];  
  }

  static filename2imploded = (filename:string):{basename:string, extension:string} => {
    const cls = FileTool;
    if(filename == null){ return undefined; }

    const extension = cls.filename2extension(filename); 
    const basename = !extension ? filename : filename.slice(0, -((extension?.length ?? 0)+1))

    return {extension, basename};
  }

  static extension2is_image = (extension:string):boolean => {
    return extension == null
      ? undefined
      : ArrayTool.in(extension?.toLowerCase(), ['jpg', 'jpeg', 'png', 'tiff', 'gif',]);
  }

  static extension2is_depictable = (extension:string):boolean => {
    const cls = FileTool;
    return extension == null
      ? undefined
      : ArrayTool.any([
        cls.extension2is_image(extension),
        ArrayTool.in(extension?.toLowerCase(), ['svg',]),
      ]);
  }
}